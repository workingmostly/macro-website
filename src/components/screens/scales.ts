/* The drag gearing from DragScale.swift, shared by the screens and the voice estimate's glide. */

/** DragScale.swift — piecewise-linear "gearing" from drag distance to value. */
export class DragScale {
  constructor(private zones: { span: number; sensitivity: number }[]) {}

  position(value: number): number {
    let position = 0;
    let remaining = Math.max(0, value);
    for (const zone of this.zones) {
      if (remaining <= zone.span) return position + remaining / zone.sensitivity;
      position += zone.span / zone.sensitivity;
      remaining -= zone.span;
    }
    return position + remaining / this.zones[this.zones.length - 1].sensitivity;
  }

  value(position: number): number {
    let remaining = Math.max(0, position);
    let value = 0;
    for (const zone of this.zones) {
      const span = zone.span / zone.sensitivity;
      if (remaining <= span) return value + remaining * zone.sensitivity;
      remaining -= span;
      value += zone.span;
    }
    return value + remaining * this.zones[this.zones.length - 1].sensitivity;
  }
}

export const SCALES = {
  calories: new DragScale([
    { span: 150, sensitivity: 0.7 },
    { span: 450, sensitivity: 1.1 },
    { span: 400, sensitivity: 2.2 },
    { span: 3000, sensitivity: 4.0 },
  ]),
  protein: new DragScale([
    { span: 80, sensitivity: 0.12 },
    { span: 80, sensitivity: 0.32 },
  ]),
};
