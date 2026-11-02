"""Transcode experimentally decoded bare-binary records to inspectable XT text.

The inferred schema is local research data, not an official Siemens catalog.
"""
from pathlib import Path
import sys
import json
from decode_bare import ROOT, decode, fields_for, load_schema, FieldDef, TypeDef, FieldType

def atom(value, kind):
    if kind in ('v','h','i','b'):
        if isinstance(value[0], (int,float)) and abs(value[0] + 3.14158e13) < 1:
            return '?'
        return ' '.join(atom(v,'f') if not isinstance(v,list) else atom(v,'i') for v in value)
    if kind == 'f':
        return '?' if abs(value + 3.14158e13) < 1 else repr(value)
    if kind == 'l': return 'T' if value else 'F'
    if kind in ('c','w'):
        return value.replace('\\','\\\\').replace('\x00','\\0').replace('\n','\\r').replace('\r','\\n')
    return str(value)

def emit(value, kind):
    if kind in ('v','h','i','b'):
        if isinstance(value[0], (int,float)) and abs(value[0] + 3.14158e13) < 1:
            return '?'
        return ''.join(emit(v,'i' if isinstance(v,list) else 'f') for v in value)
    token=atom(value,kind)
    return token + ('' if kind in ('c','w','l') or token == '?' else ' ')

def transcode(path):
    result = decode(path)
    if not result['complete']: raise ValueError(result['error'])
    schema = load_schema(str(ROOT/'research/ps-parser/assets/sch_13006.s_t'))
    schema.types[204] = TypeDef(204,'INTERSECTION_DATA','Experimental array',True,
        [FieldDef('flags',FieldType.U8,0,0),FieldDef('values',FieldType.F64,0,1)])
    types = sorted(set(n['node_type'] for n in result['nodes']))
    records = []
    for n in result['nodes']:
        t=n['node_type']; td=schema.types[t]
        parts=[str(t)+' ']
        if td.variable: parts.append(str(n['array_count'])+' ')
        parts.append(str(n['id'])+' ')
        for i,f in enumerate(fields_for(schema,t)):
            value=n[f.name]; kind=f.field_type.value
            if f.n_elements:
                parts.append(''.join(emit(v,kind) for v in value))
            else: parts.append(emit(value,kind))
        records.append(''.join(parts))
    version=result['version']; key=result['key']
    # Omit Mastercam user fields; they carry no geometric coordinates.
    text=f'T{len(version)} {version}{len(key)} {key}0 '+''.join(records)+'1 0 '
    output=path.with_suffix('.x_t'); output.write_text(text,encoding='utf8')
    catalog=['**PART1;KEY=SCH_36001;', '**END_OF_HEADER**', 'T', '1', ': SCHEMA FILE created by modeller version 3600142/36001;', f'{max(types)} {len(types)} 0 0']
    for t in types:
        td=schema.types[t]; fields=fields_for(schema,t)
        catalog.append(f'{t} {td.node_name}; {td.description}; 1 {len(fields)} {int(td.variable)}')
        for f in fields:
            catalog.append(f'{f.name}; {f.field_type.value}; 1 {f.node_class} {f.n_elements}')
    catdir=ROOT/'inferred-schema';catdir.mkdir(exist_ok=True)
    # All files share layouts; keep the union of observed types across runs.
    import re
    merged=catdir/'types.json'
    prior=json.loads(merged.read_text()) if merged.exists() else {}
    for t in types:
        td=schema.types[t]; fields=fields_for(schema,t)
        prior[str(t)]=[f'{t} {td.node_name}; {td.description}; 1 {len(fields)} {int(td.variable)}']+[f'{f.name}; {f.field_type.value}; 1 {f.node_class} {f.n_elements}' for f in fields]
    merged.write_text(json.dumps(prior,indent=2))
    catalog=catalog[:6]+[line for t in sorted(prior,key=int) for line in prior[t]]
    catalog[5]=f'{max(map(int,prior))+1} {len(prior)} {sum(len(v)-1 for v in prior.values())} 0'
    (catdir/'sch_36001.sch_txt').write_text('\n'.join(catalog)+'\n**************** end of schema SCH_3600142_36001 ****************\n')
    print(output)

if __name__=='__main__':
    for name in sys.argv[1:]: transcode(Path(name))
