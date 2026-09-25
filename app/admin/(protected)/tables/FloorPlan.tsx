"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createFloorTable, saveFloorPlan } from "@/lib/actions";
import {
  MIN_SIZE,
  MAX_SIZE,
  ROOM_WIDTH,
  type FloorTable,
} from "@/lib/floor-plan";
import styles from "./floor-plan.module.css";

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
const snap = (n: number) => Math.round(n / 10) * 10;

export default function FloorPlan({
  initialTables,
}: {
  initialTables: FloorTable[];
}) {
  const [tables, setTables] = useState(initialTables);
  const [saved, setSaved] = useState(initialTables);
  const [selectedId, select] = useState<number | null>(
    initialTables[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [grid, setGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [adding, setAdding] = useState(false);
  const room = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    mode: "move" | "resize";
    x: number;
    y: number;
    table: FloorTable;
  } | null>(null);
  const selected = tables.find((table) => table.id === selectedId);
  const dirty = JSON.stringify(tables) !== JSON.stringify(saved);
  const roomHeight = Math.max(
    680,
    ...tables.map((table) => table.y + table.height + 100),
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(id: number, changes: Partial<FloorTable>) {
    setTables((current) =>
      current.map((table) =>
        table.id === id ? { ...table, ...changes } : table,
      ),
    );
    setMessage("");
  }

  function begin(
    event: PointerEvent<HTMLButtonElement>,
    table: FloorTable,
    mode: "move" | "resize",
  ) {
    if (busy || event.button !== 0) return;
    event.stopPropagation();
    select(table.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      id: table.id,
      mode,
      x: event.clientX,
      y: event.clientY,
      table,
    };
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active || !room.current) return;
    const scale = room.current.getBoundingClientRect().width / ROOM_WIDTH;
    const dx = (event.clientX - active.x) / scale;
    const dy = (event.clientY - active.y) / scale;
    const { table } = active;
    const align = grid ? snap : Math.round;
    if (active.mode === "move") {
      update(active.id, {
        x: clamp(align(table.x + dx), 24, ROOM_WIDTH - table.width - 24),
        y: clamp(align(table.y + dy), 24, 10000 - table.height),
      });
    } else {
      update(active.id, {
        width: clamp(
          align(table.width + dx),
          MIN_SIZE,
          Math.min(MAX_SIZE, ROOM_WIDTH - table.x - 24),
        ),
        height: clamp(
          align(table.height + dy),
          MIN_SIZE,
          Math.min(MAX_SIZE, 10000 - table.y),
        ),
      });
    }
  }

  async function save() {
    setBusy(true);
    try {
      const result = await saveFloorPlan(tables);
      if (result.error) setMessage(result.error);
      else {
        setSaved(tables);
        setMessage("Floor plan saved.");
      }
    } catch {
      setMessage("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function add(formData: FormData) {
    setBusy(true);
    try {
      const result = await createFloorTable(
        String(formData.get("name") ?? ""),
        Number(formData.get("capacity")),
      );
      if (result.error) setMessage(result.error);
      else if (result.table) {
        setTables((current) => [...current, result.table]);
        setSaved((current) => [...current, result.table]);
        select(result.table.id);
        setAdding(false);
        setMessage("Table added. Move it into place, then save your layout.");
      }
    } catch {
      setMessage("Could not add the table. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.editor}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>YOUR RESTAURANT, FROM ABOVE</p>
          <h1>Floor plan</h1>
          <p>
            Make room for great company. Arrange your tables just how you like
            them.
          </p>
        </div>
        <button
          className={styles.primary}
          onClick={save}
          disabled={busy || !dirty}
        >
          {busy ? "Working…" : "Save layout"}
        </button>
      </header>
      <div className={styles.workspace}>
        <section className={styles.canvasPanel} aria-label="Floor plan editor">
          <div className={styles.toolbar}>
            <div>
              <strong>Dining room</strong>
              <span className={styles.dot}>●</span>
              <span>
                {tables.length} tables ·{" "}
                {tables.reduce((total, table) => total + table.capacity, 0)}{" "}
                seats
              </span>
            </div>
            <button
              className={styles.secondary}
              onClick={() => setAdding(!adding)}
              disabled={busy}
            >
              ＋ Add table
            </button>
          </div>
          <div className={styles.viewport}>
            <div
              className={styles.room}
              ref={room}
              style={{ width: ROOM_WIDTH * zoom, height: roomHeight * zoom }}
              onPointerDown={() => select(null)}
            >
              <div
                className={`${styles.floor} ${grid ? styles.grid : ""}`}
                style={{
                  width: ROOM_WIDTH,
                  height: roomHeight,
                  transform: `scale(${zoom})`,
                }}
              >
                <div className={styles.roomLabel}>
                  DINING ROOM <span> / FLOOR 01</span>
                </div>
                {tables.length === 0 && (
                  <div className={styles.empty}>
                    A little space. A lot of possibilities.
                    <br />
                    <button
                      className={styles.primary}
                      onClick={() => setAdding(true)}
                    >
                      Add your first table
                    </button>
                  </div>
                )}
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`${styles.tableWrap} ${table.id === selectedId ? styles.selected : ""}`}
                    style={{
                      left: table.x,
                      top: table.y,
                      width: table.width,
                      height: table.height,
                    }}
                  >
                    {Array.from({ length: table.capacity }, (_, index) => {
                      const topCount = Math.ceil(table.capacity / 2);
                      const isTop = index < topCount;
                      const count = isTop
                        ? topCount
                        : Math.floor(table.capacity / 2);
                      return (
                        <span
                          aria-hidden="true"
                          key={index}
                          className={styles.chair}
                          style={{
                            left: `${(((isTop ? index : index - topCount) + 0.5) * 100) / count}%`,
                            ...(isTop ? { top: -12 } : { bottom: -12 }),
                          }}
                        />
                      );
                    })}
                    <button
                      className={`${styles.table} ${table.shape === "round" ? styles.round : ""}`}
                      aria-label={`${table.name}, ${table.capacity} seats. Use arrow keys to move; Shift and arrows to resize.`}
                      aria-pressed={table.id === selectedId}
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation();
                        select(table.id);
                      }}
                      onPointerDown={(event) => begin(event, table, "move")}
                      onPointerMove={move}
                      onPointerUp={() => {
                        gesture.current = null;
                      }}
                      onPointerCancel={() => {
                        gesture.current = null;
                      }}
                      onKeyDown={(event) => {
                        if (
                          ![
                            "ArrowLeft",
                            "ArrowRight",
                            "ArrowUp",
                            "ArrowDown",
                          ].includes(event.key)
                        )
                          return;
                        event.preventDefault();
                        select(table.id);
                        const dx =
                          event.key === "ArrowRight"
                            ? 10
                            : event.key === "ArrowLeft"
                              ? -10
                              : 0;
                        const dy =
                          event.key === "ArrowDown"
                            ? 10
                            : event.key === "ArrowUp"
                              ? -10
                              : 0;
                        update(
                          table.id,
                          event.shiftKey
                            ? {
                                width: clamp(
                                  table.width + dx,
                                  MIN_SIZE,
                                  Math.min(MAX_SIZE, ROOM_WIDTH - table.x - 24),
                                ),
                                height: clamp(
                                  table.height + dy,
                                  MIN_SIZE,
                                  Math.min(MAX_SIZE, 10000 - table.y),
                                ),
                              }
                            : {
                                x: clamp(
                                  table.x + dx,
                                  24,
                                  ROOM_WIDTH - table.width - 24,
                                ),
                                y: clamp(
                                  table.y + dy,
                                  24,
                                  10000 - table.height,
                                ),
                              },
                        );
                      }}
                    >
                      <span className={styles.tableNumber}>
                        {String(table.id).padStart(2, "0")}
                      </span>
                      <strong>{table.name}</strong>
                      <span>{table.capacity} seats</span>
                    </button>
                    {table.id === selectedId && (
                      <button
                        className={styles.resize}
                        aria-label={`Resize ${table.name}`}
                        title="Drag to resize"
                        disabled={busy}
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => begin(event, table, "resize")}
                        onPointerMove={move}
                        onPointerUp={() => {
                          gesture.current = null;
                        }}
                        onPointerCancel={() => {
                          gesture.current = null;
                        }}
                      >
                        ↘
                      </button>
                    )}
                  </div>
                ))}
                <div className={styles.entrance}>↑ &nbsp; ENTRANCE</div>
              </div>
            </div>
          </div>
          <footer className={styles.canvasFooter}>
            <span>Drag to move · Pull the corner to resize</span>
            <div>
              <button
                aria-label="Zoom out"
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
                disabled={zoom <= 0.5}
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                aria-label="Zoom in"
                onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}
                disabled={zoom >= 1.5}
              >
                ＋
              </button>
            </div>
          </footer>
        </section>
        <aside className={styles.inspector}>
          {adding ? (
            <form action={add} className={styles.card}>
              <p className={styles.eyebrow}>GROW YOUR SPACE</p>
              <h2>Add a table</h2>
              <label>
                Table name
                <input
                  name="name"
                  placeholder="Patio 2"
                  required
                  maxLength={60}
                  autoFocus
                />
              </label>
              <label>
                Seats
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={4}
                  required
                />
              </label>
              <button className={styles.primary} disabled={busy}>
                Create table
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setAdding(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className={styles.card}>
              <p className={styles.eyebrow}>TABLE DETAILS</p>
              <h2>{selected?.name ?? "Select a table"}</h2>
              {selected ? (
                <>
                  <p>
                    {selected.capacity} seats{" "}
                    <span className={styles.pill}>
                      Table {String(selected.id).padStart(2, "0")}
                    </span>
                  </p>
                  <label>Shape</label>
                  <div className={styles.shapes}>
                    {(["rectangle", "round"] as const).map((shape) => (
                      <button
                        key={shape}
                        className={
                          selected.shape === shape ? styles.activeShape : ""
                        }
                        aria-pressed={selected.shape === shape}
                        disabled={busy}
                        onClick={() => update(selected.id, { shape })}
                      >
                        <span>{shape === "round" ? "◯" : "▭"}</span>
                        {shape === "round" ? "Round" : "Rectangle"}
                      </button>
                    ))}
                  </div>
                  <div className={styles.dimensions}>
                    {(["width", "height"] as const).map((dimension) => (
                      <label key={dimension}>
                        {dimension === "width" ? "Width" : "Depth"}
                        <input
                          aria-label={`Table ${dimension}`}
                          type="number"
                          min={MIN_SIZE}
                          max={
                            dimension === "width"
                              ? Math.min(MAX_SIZE, ROOM_WIDTH - selected.x - 24)
                              : Math.min(MAX_SIZE, 10000 - selected.y)
                          }
                          key={`${selected.id}-${dimension}-${selected[dimension]}`}
                          defaultValue={selected[dimension]}
                          disabled={busy}
                          onBlur={(event) =>
                            update(selected.id, {
                              [dimension]: clamp(
                                Number(event.target.value),
                                MIN_SIZE,
                                dimension === "width"
                                  ? Math.min(
                                      MAX_SIZE,
                                      ROOM_WIDTH - selected.x - 24,
                                    )
                                  : Math.min(MAX_SIZE, 10000 - selected.y),
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <p className={styles.hint}>
                    Dimensions are in canvas units. Resizing changes the
                    footprint; seat capacity stays the same.
                  </p>
                </>
              ) : (
                <p>
                  Click a table on the floor plan to adjust its shape and size.
                </p>
              )}
            </div>
          )}
          <div className={styles.card}>
            <h3>Make it yours</h3>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={grid}
                onChange={(event) => setGrid(event.target.checked)}
              />
              Snap to grid
            </label>
            <p className={styles.hint}>
              Use arrow keys to move a focused table. Hold Shift to resize it.
            </p>
            <button
              className={styles.secondary}
              disabled={!dirty || busy}
              onClick={() => {
                setTables(saved);
                setMessage("");
              }}
            >
              Discard layout changes
            </button>
          </div>
          <div className={styles.status} role="status">
            {message ||
              (dirty ? "● Unsaved layout changes" : "✓ Layout up to date")}
          </div>
        </aside>
      </div>
    </div>
  );
}
