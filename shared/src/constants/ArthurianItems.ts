import { ArthurianItem, EquipmentSlot } from '../types/Items';

export const ARTHURIAN_WEAPONS: Record<string, ArthurianItem> = {
    // --- CLAYMORES (Force) ---
    'claymore_t1': {
        id: 'claymore_t1',
        name: 'Claymore d\'entraînement',
        description: 'Une lourde épée en bois lestée.',
        tier: 1,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'CLAYMORE', colorOverride: 0x8B4513 },
        stats: { attackPower: 5, strength: 2 }
    },
    'claymore_t2': {
        id: 'claymore_t2',
        name: 'Claymore en fer',
        description: 'Une épée à deux mains forgée dans le fer des collines.',
        tier: 2,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'CLAYMORE', colorOverride: 0x708090 },
        stats: { attackPower: 12, strength: 5 }
    },
    'claymore_t3': {
        id: 'claymore_t3',
        name: 'Claymore en acier',
        description: 'L\'acier trempé de Camelot, équilibré et redoutable.',
        tier: 3,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'CLAYMORE', colorOverride: 0xC0C0C0 },
        stats: { attackPower: 25, strength: 10 }
    },
    'claymore_t4': {
        id: 'claymore_t4',
        name: 'Claymore d\'argent',
        description: 'Gravée de runes protectrices, efficace contre les spectres.',
        tier: 4,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'CLAYMORE', colorOverride: 0xE5E4E2 },
        stats: { attackPower: 45, strength: 18, faith: 5 }
    },
    'claymore_t5': {
        id: 'claymore_t5',
        name: 'Excalibur (Réplique Mythique)',
        description: 'Une lame imprégnée de la magie de l\'Ancienne Loi.',
        tier: 5,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'CLAYMORE', colorOverride: 0xFFD700 },
        stats: { attackPower: 100, strength: 40, faith: 20, luck: 10 }
    },

    // --- ARCS LONGS (Dextérité) ---
    'longbow_t1': {
        id: 'longbow_t1',
        name: 'Arc court en frêne',
        description: 'Un arc simple pour la chasse en forêt.',
        tier: 1,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'LONG_BOW', colorOverride: 0xDEB887 },
        stats: { attackPower: 4, dexterity: 3 }
    },
    'longbow_t2': {
        id: 'longbow_t2',
        name: 'Arc long d\'if',
        description: 'Le bois d\'if offre une tension supérieure.',
        tier: 2,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'LONG_BOW', colorOverride: 0x8B4513 },
        stats: { attackPower: 10, dexterity: 7 }
    },
    'longbow_t3': {
        id: 'longbow_t3',
        name: 'Arc de garde de Camelot',
        description: 'Renforcé avec des plaques d\'acier.',
        tier: 3,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'LONG_BOW', colorOverride: 0x556B2F },
        stats: { attackPower: 22, dexterity: 15 }
    },
    'longbow_t4': {
        id: 'longbow_t4',
        name: 'Arc de vent d\'argent',
        description: 'Ses flèches sifflent comme le vent des landes.',
        tier: 4,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'LONG_BOW', colorOverride: 0xF5F5F5 },
        stats: { attackPower: 40, dexterity: 25, luck: 5 }
    },
    'longbow_t5': {
        id: 'longbow_t5',
        name: 'Fail-not (Arc de Tristan)',
        description: 'Un arc légendaire qui ne manque jamais sa cible.',
        tier: 5,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'LONG_BOW', colorOverride: 0x00FFFF },
        stats: { attackPower: 90, dexterity: 50, luck: 20 }
    },

    // --- BÂTONS DRUIDIQUES (Sagesse) ---
    'staff_t1': {
        id: 'staff_t1',
        name: 'Bâton de marche',
        description: 'Un simple bâton de bois noueux.',
        tier: 1,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'DRUID_STAFF', colorOverride: 0xA0522D },
        stats: { attackPower: 2, wisdom: 3 }
    },
    'staff_t2': {
        id: 'staff_t2',
        name: 'Bâton de chêne druidique',
        description: 'Récolté lors d\'une nuit de pleine lune.',
        tier: 2,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'DRUID_STAFF', colorOverride: 0x228B22 },
        stats: { attackPower: 5, wisdom: 8 }
    },
    'staff_t3': {
        id: 'staff_t3',
        name: 'Bâton de l\'Ancienne Forêt',
        description: 'Le bois semble encore vivant et palpite d\'énergie.',
        tier: 3,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'DRUID_STAFF', colorOverride: 0x006400 },
        stats: { attackPower: 12, wisdom: 18, mana: 50 }
    },
    'staff_t4': {
        id: 'staff_t4',
        name: 'Bâton de cristal de roche',
        description: 'Canalise la puissance tellurique des mégalithes.',
        tier: 4,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'DRUID_STAFF', colorOverride: 0xADD8E6 },
        stats: { attackPower: 25, wisdom: 30, mana: 150, faith: 10 }
    },
    'staff_t5': {
        id: 'staff_t5',
        name: 'Bâton de Merlin',
        description: 'L\'artefact ultime de la sagesse druidique.',
        tier: 5,
        stackable: false,
        slot: EquipmentSlot.MAIN_HAND,
        visuals: { meshType: 'DRUID_STAFF', colorOverride: 0x4B0082 },
        stats: { attackPower: 60, wisdom: 60, mana: 500, faith: 30 }
    }
};
