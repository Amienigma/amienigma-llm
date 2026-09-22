export type DiscoverItem = {
  id: string;
  src: string;
  prompt: string;
  title: string;
  span: "square" | "tall" | "wide";
};

export const DISCOVER: DiscoverItem[] = [
  {
    id: "friends",
    src: "/discover/friends.jpg",
    title: "Golden hour ride",
    prompt: "Stylized cinematic portrait of two stylish friends wearing sunglasses in a convertible at golden hour, fashion editorial photography, warm film grain",
    span: "square",
  },
  {
    id: "cyber-duo",
    src: "/discover/cyber-duo.jpg",
    title: "Cockpit duo",
    prompt: "Turn us into video-game characters in a futuristic cyberpunk cockpit, sleek visors and leather jackets, neon lights, high-end concept art",
    span: "square",
  },
  {
    id: "cabin",
    src: "/discover/cabin.jpg",
    title: "Cabin at dusk",
    prompt: "Cozy snow-covered mountain cabin at dusk with warm window glow, pine trees, footprints in snow, cinematic photography",
    span: "tall",
  },
  {
    id: "food-truck",
    src: "/discover/food-truck.jpg",
    title: "Rainy neon night",
    prompt: "Cinematic photograph of a neon-lit late-night food truck on a rainy city street, pink and teal lights reflecting in wet asphalt",
    span: "square",
  },
  {
    id: "pink-cow",
    src: "/discover/pink-cow.jpg",
    title: "Cow and saucer",
    prompt: "Playful pop-art illustration of a cheerful pink cow in a bright green meadow with a vintage flying saucer beaming yellow light from above",
    span: "square",
  },
  {
    id: "motorcycle",
    src: "/discover/motorcycle.jpg",
    title: "Desert highway",
    prompt: "Vintage motorcycle parked on an empty desert highway at sunset, long shadows, dust in golden light, cinematic film still",
    span: "wide",
  },
  {
    id: "underwater",
    src: "/discover/underwater.jpg",
    title: "Glass city",
    prompt: "Dreamlike underwater city of glass towers with sunlight shafts, tropical fish and coral gardens, cinematic and ultra detailed",
    span: "wide",
  },
  {
    id: "tea-house",
    src: "/discover/tea-house.jpg",
    title: "Afternoon tea",
    prompt: "A serene Japanese tea house interior with paper lanterns, steam from a ceramic teapot, golden afternoon light through shoji screens",
    span: "tall",
  },
  {
    id: "river",
    src: "/discover/river.jpg",
    title: "Autumn river",
    prompt: "Aerial photograph of a winding turquoise river through autumn forest, golden and rust foliage, cinematic landscape",
    span: "wide",
  },
  {
    id: "glass-rings",
    src: "/discover/glass-rings.jpg",
    title: "Enigma in glass",
    prompt: "A luminescent glass sculpture of interlocking rings, cyan blue and violet light refracting through crystal on a dark studio pedestal",
    span: "square",
  },
  {
    id: "sunglasses",
    src: "/discover/sunglasses.jpg",
    title: "Studio shades",
    prompt: "Product still life of elegant black sunglasses floating on a soft white studio background with a subtle cyan and violet rim light",
    span: "square",
  },
  {
    id: "bubbles",
    src: "/discover/bubbles.jpg",
    title: "Soap galaxies",
    prompt: "Macro photograph of iridescent soap bubbles clustered on a dark surface, rainbow highlights, ultra sharp studio lighting",
    span: "square",
  },
];

export const STARTERS = [
  { id: "meet", label: "Let's get to know each other" },
  { id: "plan", label: "Plan a weekend in McKinney" },
  { id: "image", label: "Create an image of a rainy neon street" },
  { id: "video", label: "Film a short clip of mist over a lake" },
];
