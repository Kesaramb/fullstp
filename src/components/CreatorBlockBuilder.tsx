'use client'

/**
 * CreatorBlockBuilder — visual authoring for a creatorBlock spec.
 *
 * Creators compose a section from the same whitelisted node vocabulary the
 * sandboxed renderer understands. The builder only ever offers values the
 * validator accepts, so a well-formed tree round-trips to a valid spec. The
 * parent receives the spec ({ nodes }) and a validity flag on every change.
 */

import { useMemo, useState } from 'react'
import {
  CONTAINER_NODE_TYPES,
  CREATOR_NODE_TYPES,
  BACKGROUNDS,
  PADDINGS,
  GAPS,
  ALIGNS,
  TEXT_SIZES,
  ASPECTS,
  BUTTON_STYLES,
  TONES,
  HEADING_LEVELS,
  GRID_COLUMNS,
  validateCreatorBlockSpec,
  type CreatorNodeType,
} from '@/lib/templates/creator-block'

/** A node in the editor carries an internal id for stable React keys. */
interface UINode {
  _id: string
  type: CreatorNodeType
  children?: UINode[]
  [prop: string]: unknown
}

interface Field {
  key: string
  label: string
  kind: 'text' | 'textarea' | 'select' | 'check'
  options?: readonly (string | number)[]
}

const CONTAINER_SET = new Set<string>(CONTAINER_NODE_TYPES)
const isContainer = (t: string) => CONTAINER_SET.has(t)

/** The editable props for each node type — mirrors the validator's vocabulary. */
const FIELDS: Record<CreatorNodeType, Field[]> = {
  section: [
    { key: 'background', label: 'Background', kind: 'select', options: BACKGROUNDS },
    { key: 'padding', label: 'Padding', kind: 'select', options: PADDINGS },
  ],
  container: [],
  grid: [
    { key: 'columns', label: 'Columns', kind: 'select', options: GRID_COLUMNS },
    { key: 'gap', label: 'Gap', kind: 'select', options: GAPS },
  ],
  stack: [
    { key: 'gap', label: 'Gap', kind: 'select', options: GAPS },
    { key: 'align', label: 'Align', kind: 'select', options: ALIGNS },
  ],
  heading: [
    { key: 'text', label: 'Text', kind: 'text' },
    { key: 'level', label: 'Level', kind: 'select', options: HEADING_LEVELS },
    { key: 'align', label: 'Align', kind: 'select', options: ALIGNS },
  ],
  text: [
    { key: 'text', label: 'Text', kind: 'textarea' },
    { key: 'size', label: 'Size', kind: 'select', options: TEXT_SIZES },
    { key: 'align', label: 'Align', kind: 'select', options: ALIGNS },
  ],
  image: [
    { key: 'src', label: 'Image URL', kind: 'text' },
    { key: 'alt', label: 'Alt text', kind: 'text' },
    { key: 'aspect', label: 'Aspect', kind: 'select', options: ASPECTS },
    { key: 'rounded', label: 'Rounded', kind: 'check' },
  ],
  button: [
    { key: 'label', label: 'Label', kind: 'text' },
    { key: 'href', label: 'Link', kind: 'text' },
    { key: 'style', label: 'Style', kind: 'select', options: BUTTON_STYLES },
  ],
  badge: [
    { key: 'text', label: 'Text', kind: 'text' },
    { key: 'tone', label: 'Tone', kind: 'select', options: TONES },
  ],
  divider: [],
  spacer: [{ key: 'size', label: 'Size', kind: 'select', options: PADDINGS }],
}

let idSeq = 0
const newId = () => `n${Date.now().toString(36)}${(idSeq++).toString(36)}`

function makeNode(type: CreatorNodeType): UINode {
  const node: UINode = { _id: newId(), type }
  if (isContainer(type)) node.children = []
  // Seed required text-ish props so a fresh node is closer to valid.
  if (type === 'heading' || type === 'text' || type === 'badge') node.text = ''
  if (type === 'button') node.label = ''
  if (type === 'image') node.src = ''
  return node
}

/** Strip editor-only fields, producing the persisted spec node tree. */
function toSpecNodes(nodes: UINode[]): Record<string, unknown>[] {
  return nodes.map(({ _id, children, ...rest }) => {
    void _id
    const out: Record<string, unknown> = { ...rest }
    if (children) out.children = toSpecNodes(children)
    return out
  })
}

/** Immutably map the node with `id`, or recurse into children. */
function updateNode(nodes: UINode[], id: string, fn: (n: UINode) => UINode): UINode[] {
  return nodes.map((n) => {
    if (n._id === id) return fn(n)
    if (n.children) return { ...n, children: updateNode(n.children, id, fn) }
    return n
  })
}

function removeNode(nodes: UINode[], id: string): UINode[] {
  return nodes
    .filter((n) => n._id !== id)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, id) } : n))
}

interface Props {
  /** Called with the spec ({ nodes }) and whether it currently validates. */
  onChange: (spec: { nodes: unknown[] }, valid: boolean) => void
}

export default function CreatorBlockBuilder({ onChange }: Props) {
  const [nodes, setNodes] = useState<UINode[]>([])

  const { errors } = useMemo(() => validateCreatorBlockSpec({ nodes: toSpecNodes(nodes) }), [nodes])

  function commit(next: UINode[]) {
    setNodes(next)
    const specNodes = toSpecNodes(next)
    const v = validateCreatorBlockSpec({ nodes: specNodes })
    onChange({ nodes: specNodes }, v.valid)
  }

  const addRoot = (type: CreatorNodeType) => commit([...nodes, makeNode(type)])
  const addChild = (parentId: string, type: CreatorNodeType) =>
    commit(
      updateNode(nodes, parentId, (n) => ({ ...n, children: [...(n.children ?? []), makeNode(type)] })),
    )
  const setProp = (id: string, key: string, value: unknown) =>
    commit(updateNode(nodes, id, (n) => ({ ...n, [key]: value })))
  const remove = (id: string) => commit(removeNode(nodes, id))

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        {nodes.length === 0 ? (
          <p className="text-sm text-gray-400">
            Start by adding a layout container (section / stack / grid) or a single element.
          </p>
        ) : (
          <ul className="space-y-3">
            {nodes.map((n) => (
              <NodeEditor
                key={n._id}
                node={n}
                depth={0}
                onAddChild={addChild}
                onSetProp={setProp}
                onRemove={remove}
              />
            ))}
          </ul>
        )}
        <AddMenu label="Add element" onPick={addRoot} className="mt-3" />
      </div>

      {nodes.length > 0 && errors.length > 0 && (
        <ul className="text-sm text-amber-700 list-disc pl-5 space-y-0.5">
          {errors.slice(0, 8).map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {nodes.length > 0 && errors.length === 0 && (
        <p className="text-sm text-emerald-600">Section is valid and ready to submit.</p>
      )}
    </div>
  )
}

interface NodeEditorProps {
  node: UINode
  depth: number
  onAddChild: (parentId: string, type: CreatorNodeType) => void
  onSetProp: (id: string, key: string, value: unknown) => void
  onRemove: (id: string) => void
}

function NodeEditor({ node, depth, onAddChild, onSetProp, onRemove }: NodeEditorProps) {
  const fields = FIELDS[node.type]
  const container = isContainer(node.type)
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {node.type}
        </span>
        <button
          type="button"
          onClick={() => onRemove(node._id)}
          className="text-xs text-rose-600 hover:underline"
        >
          Remove
        </button>
      </div>

      {fields.length > 0 && (
        <div className="mt-2 grid sm:grid-cols-2 gap-2">
          {fields.map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              value={node[f.key]}
              onChange={(v) => onSetProp(node._id, f.key, v)}
            />
          ))}
        </div>
      )}

      {container && (
        <div className="mt-3 border-l-2 border-gray-100 pl-3 space-y-2">
          {(node.children ?? []).map((c) => (
            <ul key={c._id}>
              <NodeEditor
                node={c}
                depth={depth + 1}
                onAddChild={onAddChild}
                onSetProp={onSetProp}
                onRemove={onRemove}
              />
            </ul>
          ))}
          {depth < 6 && (
            <AddMenu label="Add child" onPick={(t) => onAddChild(node._id, t)} />
          )}
        </div>
      )}
    </li>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (field.kind === 'check') {
    return (
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    )
  }
  if (field.kind === 'select') {
    return (
      <label className="block">
        <span className="text-xs font-medium text-gray-600">{field.label}</span>
        <select
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') return onChange(undefined)
            const num = Number(raw)
            onChange(Number.isFinite(num) && String(num) === raw ? num : raw)
          }}
          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm capitalize"
        >
          <option value="">default</option>
          {field.options?.map((o) => (
            <option key={String(o)} value={String(o)}>
              {o}
            </option>
          ))}
        </select>
      </label>
    )
  }
  const common =
    'mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-mono'
  return (
    <label className="block sm:col-span-2">
      <span className="text-xs font-medium text-gray-600">{field.label}</span>
      {field.kind === 'textarea' ? (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className={common}
        />
      ) : (
        <input
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="supports {{tokens}}"
          className={common}
        />
      )}
    </label>
  )
}

function AddMenu({
  label,
  onPick,
  className,
}: {
  label: string
  onPick: (t: CreatorNodeType) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={className}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400"
        >
          + {label}
        </button>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {CREATOR_NODE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onPick(t)
                setOpen(false)
              }}
              className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white capitalize"
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500"
          >
            cancel
          </button>
        </div>
      )}
    </div>
  )
}
