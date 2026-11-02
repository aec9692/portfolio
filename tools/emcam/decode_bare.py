"""Experimental decoder. Its output is research data, not a validated CAD export.

Uses the MIT ps-parser's published V13 field definitions as a baseline, with
explicit recorded layout changes. Stops at the first unrecognized record.
"""
from pathlib import Path
import struct
import sys
import json
import math
from collections import Counter

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'research' / 'ps-parser'))
from psparser.schema import load_schema, FieldDef, TypeDef
from psparser.reader import FieldType


class Reader:
    def __init__(self, data):
        self.data = data
        self.pos = 0

    def take(self, count):
        if count < 0 or self.pos + count > len(self.data):
            raise ValueError(f'Out of bounds at {self.pos}, length {count}')
        b = self.data[self.pos:self.pos+count]
        self.pos += count
        return b

    def scalar(self, kind):
        code = {'n':'h', 'd':'i', 'f':'d', 'u':'B', 'l':'B'}[kind]
        value = struct.unpack('<'+code, self.take(struct.calcsize(code)))[0]
        if kind == 'l' and value not in (0, 1):
            raise ValueError(f'Invalid bool {value} at {self.pos-1}')
        if kind == 'f' and not math.isfinite(value):
            raise ValueError(f'Nonfinite float at {self.pos-8}')
        return value

    def pointer(self):
        v = self.scalar('n')
        if not v: raise ValueError(f'Invalid zero encoded pointer at {self.pos-2}')
        q = self.scalar('n') if v < 0 else 0
        return q * 32767 + abs(v) - 1

    def field(self, kind):
        if kind == 'p': return self.pointer()
        if kind == 'c': return self.take(1).decode('latin1')
        if kind == 'w': return self.take(2).decode('utf-16-le')
        if kind in ('v','h'): return [self.scalar('f') for _ in range(3)]
        if kind == 'i': return [self.scalar('f') for _ in range(2)]
        if kind == 'b': return [self.field('i') for _ in range(3)]
        return self.scalar(kind)


def fields_for(schema, node_type):
    fields = list(schema.types[node_type].fields)
    # Modern standard-schema layouts documented by cadconvert's V20+ research.
    if node_type == 12:
        fields[7:7] = [FieldDef(f'unknown_modern_{i}',FieldType.POINTER,0,0) for i in range(3)]
        at = next(i for i,f in enumerate(fields) if f.name == 'region')
        fields[at:at] = [FieldDef(n,FieldType.POINTER,0,0) for n in ('boundary_mesh','boundary_polyline','boundary_modern')]
        fields += [FieldDef(n, FieldType(k), 0, 0) for n,k in
                   [('index_map_offset','d'),('index_map','p'),
                    ('node_id_index_map','p'),('schema_embedding_map','p'),
                    ('child','p'),('lowest_node_id','d'),('data','p')]]
    if node_type == 70:
        fields = [FieldDef(n, FieldType(k), 0, 0) for n,k in
                  [('node_id','d'),('list_type','u'),('notransmit','l'),
                   ('owner','p'),('next','p'),('previous','p'),
                   ('list_length','d'),('block_length','d'),('finger_index','d'),
                   ('finger_block','p'),('list_block','p')]]
    if node_type == 74:
        fields.insert(1, FieldDef('index_map_offset',FieldType.I32,0,0))
    if node_type == 19:
        fields.insert(-1, FieldDef('unknown_modern_region',FieldType.POINTER,0,0))
        fields.append(FieldDef('owner',FieldType.POINTER,0,0))
    if node_type == 80:
        fields = [FieldDef(f.name,f.field_type,f.node_class,17 if f.name == 'legal_owners' else f.n_elements) for f in fields]
    if node_type == 38:
        fields += [FieldDef('modern_intersection_data',FieldType.POINTER,0,0)]
    if node_type == 41:
        fields.insert(1, FieldDef('modern_limit_type',FieldType.CHAR,0,0))
    return fields


def decode(path):
    schema = load_schema(str(ROOT / 'research/ps-parser/assets/sch_13006.s_t'))
    schema.types[204] = TypeDef(204,'INTERSECTION_DATA','Experimental array',True,
        [FieldDef('flags',FieldType.U8,0,0),FieldDef('values',FieldType.F64,0,1)])
    r = Reader(path.read_bytes())
    if r.take(1) != b'B': raise ValueError('Expected bare binary')
    version = r.take(r.scalar('d')).decode('ascii')
    key = r.take(r.scalar('d')).decode('ascii')
    user_size = r.scalar('d')
    if key != 'SCH_3600142_36001' or user_size not in (0,1):
        raise ValueError(f'Unexpected header {key}, user_size={user_size}')
    nodes = []
    # PK-visible entities have trailing integer user fields (XT specification).
    visible = {10,11,12,13,14,15,16,17,18,19,29,30,31,32,33,34,35,36,
               50,51,52,53,54,55,70,80,81,100,101,124,134}
    try:
        while True:
            start = r.pos
            node_type = r.scalar('n')
            if node_type == 1:
                assert r.pointer() == 0
                assert r.pos == len(r.data), (r.pos,len(r.data))
                return dict(complete=True, version=version,key=key,nodes=nodes)
            if node_type not in schema.types: raise ValueError(f'Unknown type {node_type} at {start}')
            node_def = schema.types[node_type]
            count = r.scalar('d') if node_def.variable else None
            if count is not None and not 0 <= count < 1000000:
                raise ValueError(f'Invalid count {count} for {node_type} at {start}')
            ident = r.pointer()
            fields = fields_for(schema,node_type)
            node = dict(node_type=node_type,kind=node_def.node_name,id=ident,byte_start=start,array_count=count)
            for i,field in enumerate(fields):
                n = count if node_def.variable and i == len(fields)-1 else max(1,field.n_elements)
                values = [r.field(field.field_type.value) for _ in range(n)]
                node[field.name] = values if n != 1 or field.n_elements else values[0]
            node['user'] = [r.scalar('d') for _ in range(user_size)]
            node['byte_end'] = r.pos
            nodes.append(node)
    except Exception as e:
        return dict(complete=False, version=version,key=key,error=str(e),
                    partial_node=locals().get('node'),offset=r.pos,context=r.data[max(0,r.pos-32):r.pos+64].hex(' '),nodes=nodes)


if __name__ == '__main__':
    for name in sys.argv[1:]:
        path = Path(name)
        result = decode(path)
        out = path.with_suffix('.decoded.json')
        out.write_text(json.dumps(result,indent=2),encoding='utf8')
        print(path.name, result['complete'], len(result['nodes']),
              Counter(n['kind'] for n in result['nodes']),result.get('error',''))
        if not result['complete']:
            print('last:',result['nodes'][-1:] if len(result['nodes'])<4 else result['nodes'][-1:][0]['kind'],result['context'])
            print('partial:', result.get('partial_node'))
