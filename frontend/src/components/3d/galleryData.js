import {
  cosmicTexture, geometricTexture, organicTexture, warmTexture,
  sapphireTexture, steelTexture, crystalTexture, ironTexture,
  modernTexture, navyTexture,
} from './textures';

export const PAINTING_DATA = [
  { id:'ask',                title:'Cosmic Dawn',      artist:'AI Intelligence',     featureTitle:'Ask ShiftMind AI',      featureIcon:'🧠', featureLabel:'— CLICK TO ENTER —', textureGen:cosmicTexture },
  { id:'dashboard',          title:'Golden Ratio',     artist:'Market Intelligence', featureTitle:'Market Intelligence',   featureIcon:'📊', featureLabel:'— CLICK TO ENTER —', textureGen:geometricTexture },
  { id:'knowledge',          title:'Emerald Flow',     artist:'Enterprise Brain',    featureTitle:'Enterprise Brain',      featureIcon:'📚', featureLabel:'— CLICK TO ENTER —', textureGen:organicTexture },
  { id:'capture',            title:'Vermilion Sun',    artist:'Upload Knowledge',    featureTitle:'Upload Knowledge',      featureIcon:'📤', featureLabel:'— CLICK TO ENTER —', textureGen:warmTexture },
  { id:'journal',            title:'Sapphire Depths',  artist:'Work Journal',        featureTitle:'Work Journal',          featureIcon:'📝', featureLabel:'— CLICK TO ENTER —', textureGen:sapphireTexture },
  { id:'workflows',          title:'Steel Pulse',      artist:'Workflow Recorder',   featureTitle:'Workflow Recorder',     featureIcon:'⚙️', featureLabel:'— CLICK TO ENTER —', textureGen:steelTexture },
  { id:'experts',            title:'Crystal Mind',     artist:'Expert Finder',       featureTitle:'Expert Finder',         featureIcon:'🔍', featureLabel:'— CLICK TO ENTER —', textureGen:crystalTexture },
  { id:'checklists',         title:'Iron Guard',       artist:'Daily Checklists',    featureTitle:'Daily Checklists',      featureIcon:'✅', featureLabel:'— CLICK TO ENTER —', textureGen:ironTexture },
  { id:'approvals',          title:'Royal Decree',     artist:'Approvals & Review',  featureTitle:'Approvals & Review',    featureIcon:'📜', featureLabel:'— CLICK TO ENTER —', textureGen:modernTexture },
  { id:'knowledge-manager',  title:'Omniscient',       artist:'Knowledge Manager',   featureTitle:'Knowledge Manager',     featureIcon:'🗂️', featureLabel:'— CLICK TO ENTER —', textureGen:navyTexture },
];

export const GALLERY_RADIUS = 19.5;
