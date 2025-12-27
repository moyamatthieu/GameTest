export enum ResourceType {
  IRON = 'Fer',
  COPPER = 'Cuivre',
  WATER = 'Eau',
  HELIUM3 = 'Hélium-3',
  SILICON = 'Silicium',
  URANIUM = 'Uranium',
  TITANIUM = 'Titane',
  RARE_EARTHS = 'Terres Rares',
  HYDROGEN = 'Hydrogène',
  CARBON = 'Carbone'
}

export interface ResourceStack {
  type: ResourceType;
  amount: number;
}
