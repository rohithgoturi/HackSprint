export const mockIssues = [
  {
    id: "CIV-1001",
    title: "Deep Pothole in Left Lane",
    category: "Pothole",
    description: "A large and deep pothole has opened up in the left lane near the intersection. Several vehicles have sustained tire damage. Immediate repair is required to prevent accidents.",
    location: { lat: 37.7749, lng: -122.4194 },
    ward: "District 6",
    priority: "High",
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-10T08:30:00.000Z",
    updatedAt: "2026-08-11T14:15:00.000Z"
  },
  {
    id: "CIV-1002",
    title: "Overflowing Public Garbage Bin",
    category: "Garbage Overflow",
    description: "The public trash bin near the bus stop has not been cleared for three days. Waste is spilling onto the pavement, creating unsanitary conditions and attracting pests.",
    location: { lat: 37.7842, lng: -122.4021 },
    ward: "District 3",
    priority: "Medium",
    status: "Submitted",
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-12T06:15:00.000Z",
    updatedAt: "2026-08-12T06:15:00.000Z"
  },
  {
    id: "CIV-1003",
    title: "Flickering Streetlight on Corner",
    category: "Broken Streetlight",
    description: "The streetlight at the corner of 24th and Mission is flickering constantly and going dark for long intervals, leaving the sidewalk poorly lit and unsafe at night.",
    location: { lat: 37.7525, lng: -122.4184 },
    ward: "District 9",
    priority: "Low",
    status: "Submitted",
    image: "https://images.unsplash.com/photo-1509099652299-fd7c17242c4c?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-11T20:45:00.000Z",
    updatedAt: "2026-08-11T20:45:00.000Z"
  },
  {
    id: "CIV-1004",
    title: "Water Main Leak on Sidewalk",
    category: "Water Leakage",
    description: "Significant water is bubbling up from beneath the concrete sidewalk slab, causing local flooding along the gutter and wasting treated water.",
    location: { lat: 37.7699, lng: -122.4468 },
    ward: "District 5",
    priority: "High",
    status: "Resolved",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-05T09:00:00.000Z",
    updatedAt: "2026-08-08T16:30:00.000Z"
  },
  {
    id: "CIV-1005",
    title: "Clogged Storm Drain",
    category: "Drainage",
    description: "The storm water drain inlet is completely blocked with leaves and street debris, causing significant pooling of water during even light rainfall.",
    location: { lat: 37.7954, lng: -122.3942 },
    ward: "District 3",
    priority: "Medium",
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-09T11:20:00.000Z",
    updatedAt: "2026-08-10T10:00:00.000Z"
  },
  {
    id: "CIV-1006",
    title: "Collapsed Sidewalk Curb",
    category: "Road Damage",
    description: "A section of the concrete sidewalk curb has collapsed near the pedestrian crossing, creating a tripping hazard and blocking wheelchair ramp accessibility.",
    location: { lat: 37.7599, lng: -122.4352 },
    ward: "District 8",
    priority: "High",
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1599740831464-59cb4a52a36b?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-08T15:10:00.000Z",
    updatedAt: "2026-08-10T09:00:00.000Z"
  },
  {
    id: "CIV-1007",
    title: "Damaged Public Park Bench",
    category: "Public Infrastructure",
    description: "Two wooden slats on the park bench have snapped, exposing rusted screws and splintered wood. The bench is currently unusable and dangerous.",
    location: { lat: 37.7694, lng: -122.4862 },
    ward: "District 4",
    priority: "Low",
    status: "Resolved",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-04T12:00:00.000Z"
  }
];

export const issueCategories = [
  "Pothole",
  "Road Damage",
  "Garbage Overflow",
  "Broken Streetlight",
  "Water Leakage",
  "Drainage",
  "Public Infrastructure"
];

export const issueStatuses = [
  "Submitted",
  "In Progress",
  "Resolved"
];

export const issuePriorities = [
  "Low",
  "Medium",
  "High"
];
