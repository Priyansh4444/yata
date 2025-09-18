import { JSX } from "solid-js";
import { createSortable, maybeTransformStyle, type Id } from "@thisbeyond/solid-dnd";

interface SortableTaskCardProps {
  id: Id;
  group: string;
  children: JSX.Element;
}

export default function SortableTaskCard(props: SortableTaskCardProps) {
  const sortable = createSortable(props.id, {
    type: "item",
    group: props.group,
  });

  return (
    <div
      ref={sortable.ref}
      style={maybeTransformStyle(sortable.transform)}
      {...sortable.dragActivators}
      classList={{ "opacity-25": sortable.isActiveDraggable }}
    >
      {props.children}
    </div>
  );
}


