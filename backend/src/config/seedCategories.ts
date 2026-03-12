import { Category } from "../models/Category.js";
import { slugify } from "../utils/slug.js";

const TREE: { name: string; children: string[] }[] = [
  { name: "Consumer Electronics", children: ["Mobile phones", "Laptops", "Televisions", "Speakers", "Routers", "Printers", "Tablets"] },
  { name: "Mobile Subparts", children: ["Displays", "Batteries", "IC chips", "Charging ports", "Microphones", "Camera modules"] },
  { name: "Computer Components", children: ["Motherboards", "RAM", "SSD", "GPU", "Power supplies", "Keyboards", "Mouse"] },
  { name: "Electrical Items", children: ["LED bulbs", "Switches", "Wires", "Sockets", "Extension boards"] },
  { name: "Small Electronic Components", children: ["Resistors", "Capacitors", "Transistors", "IC chips", "Microcontrollers"] },
  { name: "Drone Parts", children: ["Frames", "Propellers", "Motors", "ESC", "Flight controllers", "GPS modules", "Batteries"] },
  { name: "Air Conditioner Parts", children: ["Compressors", "PCB boards", "Sensors", "Capacitors", "Fan motors"] },
  { name: "Industrial Electronics", children: ["Relays", "Transformers", "PLC modules", "Voltage regulators"] },
  { name: "Tools & Testing Equipment", children: ["Multimeters", "Soldering stations", "Repair kits"] }
];

export async function seedCategoriesIfEmpty() {
  const count = await Category.countDocuments({});
  if (count > 0) return;

  const parents = await Category.insertMany(
    TREE.map((t, i) => ({
      name: t.name,
      slug: slugify(t.name),
      sortOrder: i,
      isActive: true
    }))
  );

  const parentByName = new Map(parents.map((p) => [p.name, p]));
  const children = TREE.flatMap((t) =>
    t.children.map((c, idx) => ({
      name: c,
      slug: `${slugify(c)}-${slugify(t.name)}`,
      parentId: parentByName.get(t.name)!._id,
      sortOrder: idx,
      isActive: true
    }))
  );
  await Category.insertMany(children);
}

