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
    prompt:
      "Stylized cinematic portrait of two stylish friends wearing sunglasses in a convertible at golden hour, fashion editorial photography, warm film grain",
    span: "square",
  },
  {
    id: "cyber-duo",
    src: "/discover/cyber-duo.jpg",
    title: "Corridor cockpit",
    prompt:
      "Two figures in a narrow cybercore corridor cockpit, teal weather through the canopy, one magenta pulse on the instrument glass, leather jackets, analog grain, high-end concept art — one true object: a cracked FM shield badge on the dash",
    span: "square",
  },
  {
    id: "cabin",
    src: "/discover/cabin.jpg",
    title: "Cabin at dusk",
    prompt:
      "Cozy snow-covered mountain cabin at dusk with warm window glow, pine trees, footprints in snow, cinematic photography",
    span: "tall",
  },
  {
    id: "food-truck",
    src: "/discover/food-truck.jpg",
    title: "Pumpjack at magenta hour",
    prompt:
      "108 LOCK still: a lone Texas pumpjack on caliche hardpan at magenta hour, teal weather sky, analog film grain, wet asphalt ribbon, one true object — the pumpjack — nothing added to win the picture, cinematic night grade teal #164e57 and magenta #c21e6b",
    span: "square",
  },
  {
    id: "pink-cow",
    src: "/discover/pink-cow.jpg",
    title: "Cow and saucer",
    prompt:
      "Playful pop-art illustration of a cheerful pink cow in a bright green meadow with a vintage flying saucer beaming yellow light from above",
    span: "square",
  },
  {
    id: "motorcycle",
    src: "/discover/motorcycle.jpg",
    title: "Caliche under teal weather",
    prompt:
      "Vintage motorcycle parked on white caliche hardpan under teal weather sky, long shadows, magenta pulse on the chrome, dust and analog grain, Texas highway, cinematic film still — one true object: the bike",
    span: "wide",
  },
  {
    id: "underwater",
    src: "/discover/underwater.jpg",
    title: "Wormhole glass city",
    prompt:
      "Dreamlike underwater city of glass towers as a Neglect Archive wormhole — sunlight shafts like corridor doors, tropical fish, coral gardens, cyan-violet refraction, cinematic and ultra detailed",
    span: "wide",
  },
  {
    id: "tea-house",
    src: "/discover/tea-house.jpg",
    title: "Afternoon tea",
    prompt:
      "A serene Japanese tea house interior with paper lanterns, steam from a ceramic teapot, golden afternoon light through shoji screens",
    span: "tall",
  },
  {
    id: "river",
    src: "/discover/river.jpg",
    title: "Autumn river",
    prompt:
      "Aerial photograph of a winding turquoise river through autumn forest, golden and rust foliage, cinematic landscape",
    span: "wide",
  },
  {
    id: "glass-rings",
    src: "/discover/glass-rings.jpg",
    title: "Enigma in glass",
    prompt:
      "A luminescent glass sculpture of interlocking rings — the Enigma — cyan-teal and magenta-violet light refracting through crystal on a dark studio pedestal, analog grain, one true object, 108 LOCK night grade",
    span: "square",
  },
  {
    id: "sunglasses",
    src: "/discover/sunglasses.jpg",
    title: "Studio shades",
    prompt:
      "Product still life of elegant black sunglasses floating on a soft white studio background with a subtle cyan and violet rim light",
    span: "square",
  },
  {
    id: "bubbles",
    src: "/discover/bubbles.jpg",
    title: "Soap galaxies",
    prompt:
      "Macro photograph of iridescent soap bubbles clustered on a dark surface, rainbow highlights, ultra sharp studio lighting",
    span: "square",
  },
];

export const STARTERS = [
  { id: "meet", label: "Let's get to know each other" },
  { id: "plan", label: "Plan a weekend in McKinney" },
  { id: "image", label: "Paint a pumpjack at magenta hour" },
  { id: "video", label: "Film a corridor wormhole in teal weather" },
  { id: "archive", label: "Open a Neglect Archive rabbit hole" },
  { id: "lock", label: "Direct a still under 108 LOCK Law" },
];
