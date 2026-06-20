"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

const HANDLE_SIDES = [
  { position: Position.Top, id: "top" },
  { position: Position.Right, id: "right" },
  { position: Position.Bottom, id: "bottom" },
  { position: Position.Left, id: "left" },
] as const;

export interface GraphNoteNodeData {
  label: React.ReactNode;
  borderColor: string;
}

function GraphNoteNode({ data }: NodeProps<GraphNoteNodeData>) {
  return (
    <div
      className="relative"
      style={{
        background: "var(--card, #fff)",
        border: `2px solid ${data.borderColor}`,
        borderRadius: "12px",
        padding: "10px 14px",
        fontSize: "12px",
        width: 150,
        boxShadow: `0 2px 8px ${data.borderColor}30`,
        cursor: "pointer",
      }}
    >
      {HANDLE_SIDES.map(({ position, id }) => (
        <Handle
          key={`${id}-t`}
          type="target"
          position={position}
          id={`${id}-t`}
          className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0"
        />
      ))}
      {HANDLE_SIDES.map(({ position, id }) => (
        <Handle
          key={`${id}-s`}
          type="source"
          position={position}
          id={`${id}-s`}
          className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0"
        />
      ))}
      {data.label}
    </div>
  );
}

export default memo(GraphNoteNode);