export const DIMS = ['Ξ','T','R','E','M','V','S','A','F','φe','φc'] as const;
export type Dim = typeof DIMS[number];
export type Vec = Record<Dim, number>;

export const DIM_DESC: Record<Dim, string> = {
  'Ξ':'Pause/Silence','T':'Tension','R':'Relation','E':'Expansion',
  'M':'Memory','V':'Void','S':'System','A':'Action','F':'Focus',
  'φe':'Fractal expansion','φc':'Fractal contraction',
};

export interface Domain {
  name: string;
  icon: string;
  vocab: Record<Dim, string[]>;
}

export const DOMAINS: Record<string, Domain> = {
  physics:   { name:'Physics',     icon:'⚛', vocab:{ 'Ξ':['quantum vacuum','equilibrium point','ground state'],'T':['tension','gradient','force field','entropy'],'R':['gravitational field','interaction','coupling'],'E':['expansion','kinetic energy','rising entropy'],'M':['inertia','mass','system history'],'V':['dissipation','radiation','energy loss'],'S':['symmetry','conservation','invariant law'],'A':['acceleration','momentum','work'],'F':['energy focus','resonance','coherence'],'φe':['expansive fractal','deterministic chaos'],'φc':['singularity','gravitational collapse'] } },
  music:     { name:'Music',       icon:'♪', vocab:{ 'Ξ':['silence','rest','fermata'],'T':['dissonance','harmonic tension','diminished chord'],'R':['counterpoint','harmony','consonance'],'E':['crescendo','modulation','thematic development'],'M':['recurring motif','leitmotif','main theme'],'V':['decrescendo','resolution','cadence'],'S':['formal structure','sonata form','tonality'],'A':['rhythm','tempo','pulse'],'F':['main melody','solo voice','timbral focus'],'φe':['improvisation','free variation'],'φc':['pedal tone','ostinato','loop'] } },
  psychology:{ name:'Psychology',  icon:'◉', vocab:{ 'Ξ':['reflective pause','full presence','mindfulness'],'T':['inner conflict','anxiety','cognitive dissonance'],'R':['bond','attachment','transference'],'E':['growth','openness','self-expansion'],'M':['implicit memory','trauma','personal history'],'V':['catharsis','letting go','grief'],'S':['ego structure','defense','cognitive schema'],'A':['behavior','impulse','agency'],'F':['attention','concentration','cognitive flow'],'φe':['divergent thinking','creativity'],'φc':['rumination','obsessive loop'] } },
  narrative: { name:'Narrative',   icon:'§', vocab:{ 'Ξ':['dramatic pause','ellipsis','frozen time'],'T':['conflict','antagonism','knot'],'R':['character relationship','alliance','love'],'E':['climax','revelation','world opening'],'M':['backstory','flashback','hero memory'],'V':['mentor death','loss','sacrifice'],'S':['narrative structure','character arc','plot'],'A':['action','decision','plot twist'],'F':['hero goal','call to adventure'],'φe':['open world','multiple endings'],'φc':['inevitable fate','tragedy'] } },
  biology:   { name:'Biology',     icon:'❋', vocab:{ 'Ξ':['homeostasis','resting state','latency'],'T':['inflammation','cell stress','alarm signal'],'R':['symbiosis','cell communication','neural network'],'E':['growth','differentiation','mitosis'],'M':['DNA','epigenetics','immune memory'],'V':['apoptosis','autophagy','programmed cell death'],'S':['organism','ecosystem','homeostatic regulation'],'A':['movement','metabolism','motor response'],'F':['specialization','ecological niche','selection'],'φe':['evolution','phylogenetic branching'],'φc':['extinction','ecological collapse'] } },
  math:      { name:'Mathematics', icon:'∑', vocab:{ 'Ξ':['zero','neutral element','fixed point'],'T':['derivative','gradient','discontinuity'],'R':['function','morphism','equivalence relation'],'E':['integral','divergent series','open space'],'M':['recursion','series','memory function'],'V':['limit to zero','empty set','kernel'],'S':['axiom','theorem','algebraic structure'],'A':['operator','transformation','mapping'],'F':['convergence','attractor point','optimum'],'φe':['fractal','non-integer dimension','chaos'],'φc':['singular point','function zero'] } },
  philosophy:{ name:'Philosophy',  icon:'◬', vocab:{ 'Ξ':['epoché','socratic silence','buddhist void'],'T':['dialectic','contradiction','aporia'],'R':['intersubjectivity','logos','I-Thou relation'],'E':['becoming','transcendence','openness to being'],'M':['collective memory','tradition','history of being'],'V':['nothingness','nihilism','ontological void'],'S':['philosophical system','category','principle'],'A':['praxis','will','free act'],'F':['truth','intellectual clarity','intuition'],'φe':['potential infinite','pure possibility'],'φc':['determinism','logical necessity'] } },
  ecology:   { name:'Ecology',     icon:'❀', vocab:{ 'Ξ':['ecological climax','balance','stable state'],'T':['competition','predation','environmental stress'],'R':['trophic web','symbiosis','interdependence'],'E':['ecological succession','colonization','dispersal'],'M':['seed bank','soil memory','cycle'],'V':['decomposition','nutrient recycling'],'S':['ecosystem','biome','biogeochemical cycle'],'A':['migration','energy flow','water cycle'],'F':['keystone species','fundamental niche'],'φe':['biodiversity','speciation'],'φc':['mass extinction','trophic collapse'] } },
};

export function fisherRao(a: Vec, b: Vec): number {
  const eps = 1e-8;
  const sa = Object.values(a).reduce((x,y) => x+y, 0) + eps;
  const sb = Object.values(b).reduce((x,y) => x+y, 0) + eps;
  let dot = 0;
  DIMS.forEach(d => { dot += Math.sqrt((a[d]/sa) * (b[d]/sb)); });
  return Math.acos(Math.min(1, Math.max(-1, dot)));
}

export function toSignature(vec: Vec): string {
  const dom = DIMS.filter(d => vec[d] > 0.45).sort((a,b) => vec[b]-vec[a]);
  if (!dom.length) return 'Ξ { E }';
  if (dom.length === 1) return dom[0];
  if (dom.includes('M') && dom.includes('R')) return `M { R { ${dom[2]||'E'} } }`;
  if (dom.includes('T') && dom.includes('E')) return `T { E }`;
  if (dom.includes('E') && dom.includes('R')) return `E { R }`;
  if (dom.includes('S') && dom.includes('A')) return `S { A }`;
  return `${dom[0]} { ${dom[1]} }`;
}

export function normalize(vec: Partial<Record<string, number>>): Vec {
  const out = {} as Vec;
  DIMS.forEach(d => {
    const v = vec[d] ?? 0.08;
    out[d] = Math.max(0, Math.min(1, Number(v) || 0.08));
  });
  return out;
}

export interface TranslationItem {
  dim: Dim;
  intensity: number;
  words: string[];
  desc: string;
}

export function translate(vec: Vec, domainKey: string): TranslationItem[] {
  const dom = DOMAINS[domainKey];
  return DIMS
    .map(d => ({ d, v: vec[d] }))
    .sort((a,b) => b.v - a.v)
    .slice(0, 4)
    .filter(x => x.v > 0.12)
    .map(({d, v}) => ({ dim: d, intensity: v, words: dom.vocab[d] || [], desc: DIM_DESC[d] }));
}

export function makeSentence(translations: TranslationItem[], domainName: string, concept: string, seed = 0): string {
  if (!translations.length) return `"${concept}" has no clear translation in ${domainName}.`;
  // deterministic per concept+domain
  const pick = (arr: string[], salt: number) => arr[Math.abs((seed + salt) % arr.length)] || arr[0];
  const parts = translations.slice(0,3)
    .map((t, i) => pick(t.words, i))
    .filter(Boolean);
  if (!parts.length) return `Translation pending.`;
  if (parts.length === 1) return `In ${domainName}: ${parts[0]}.`;
  if (parts.length === 2) return `In ${domainName}: ${parts[0]} in tension with ${parts[1]}.`;
  return `In ${domainName}: ${parts[0]} generating ${parts[1]} through ${parts[2]}.`;
}

export function midpoint(a: Vec, b: Vec): Vec {
  const out = {} as Vec;
  DIMS.forEach(d => { out[d] = (a[d] + b[d]) / 2; });
  return out;
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
