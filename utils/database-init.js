const fs = require('fs').promises;
const fsSync = require('fs').promises;
const path = require('path');
const ImageComposer = require('./image-composer');

// Timeout for database initialization (60 seconds)
const DATABASE_INIT_TIMEOUT = 60000;

// Predefined default content for various files
const DEFAULT_CONTENTS = {
    'config.json': { version: '1.0.0' },
    'reservations.json': { reservations: [] },
    'birthday-data.json': { birthdays: [] },
    'league-data.json': { leagues: [] },
    'league-config.json': { config: {} },
    'raid-loot.json': getHardcodedRaidLootData()
};

const EXACT_COPY_FILES = [
    'raid-loot.json'
];

function getHardcodedRaidLootData() {
    return {
        "raid": "Palazzo dei Nerub'ar",
        "bosses": [
          {
            "id": 2607,
            "name": "Ulgrax il Divoratore",
            "loot": [
              {
                "id": "219915",
                "name": "Chelicera del Behemoth Corrotto",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_foulbehemothschelicera_red.jpg",
                "wowhead_url": "https://www.wowhead.com/item=219915",
                "emojiId": "1234567890",
                "emojiName": "item_219915"
              },
              {
                "id": "212424",
                "name": "Spallacci con Macigni dei Terrigeni Veterani",
                "type": "Spalle Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_plate_raidwarriornerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212424",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_plate_raidwarriornerubian_d_01.jpg"
              },
              {
                "id": "212426",
                "name": "Polsiere dell'Intruso Croccante",
                "type": "Polsi Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidwarlocknerubian_d_01_bracer.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212426",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidwarlocknerubian_d_01_bracer.jpg"
              },
              {
                "id": "212425",
                "name": "Interiora Tese del Divoratore",
                "type": "Fianchi Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_leather_raidroguenerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212425",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_leather_raidroguenerubian_d_01.jpg"
              },
              {
                "id": "212446",
                "name": "Emblema Regale di Nerub'ar",
                "type": "Schiena Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cape_special_nerubian_d_02.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212446",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cape_special_nerubian_d_02.jpg"
              },
              {
                "id": "212388",
                "name": "Schiacciabocconi di Ulgrax",
                "type": "Due mani Mazza",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_2h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212388",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_2h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212419",
                "name": "Imbracatura Zuppa di Bile",
                "type": "Torso Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidwarlocknerubian_d_01_robe.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212419",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidwarlocknerubian_d_01_robe.jpg"
              },
              {
                "id": "212386",
                "name": "Guscio dell'Oscurità Inghiottente",
                "type": "Mano secondaria Scudo",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212386",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02.jpg"
              },
              {
                "id": "212442",
                "name": "Grancintura del Famelico",
                "type": "Fianchi Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_buckle_raiddeathknightnerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212442",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_buckle_raiddeathknightnerubian_d_01.jpg"
              },
              {
                "id": "212409",
                "name": "Artiglio Sfregiato di Veleno",
                "type": "Una mano Tirapugni",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_hand_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212409",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_hand_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212423",
                "name": "Pantaloni di Midollo Secco del Ribelle",
                "type": "Gambe Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_pant_leather_raidmonknerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212423",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_pant_leather_raidmonknerubian_d_01.jpg"
              },
              {
                "id": "212428",
                "name": "Corna del Pasto Finale",
                "type": "Testa Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mail_raidhunternerubian_d_01_helm.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212428",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mail_raidhunternerubian_d_01_helm.jpg"
              },
              {
                "id": "212431",
                "name": "Calzature Piene di Sottofalene",
                "type": "Piedi Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mail_raidhunternerubian_d_01_boot.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212431",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mail_raidhunternerubian_d_01_boot.jpg"
              }
            ]
          },
          {
            "id": 2611,
            "name": "Orrore Vincolasangue",
            "loot": [
              {
                "id": "219917",
                "name": "Coagulo Strisciante",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_creepingcoagulum_purple.jpg",
                "wowhead_url": "https://www.wowhead.com/item=219917",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_creepingcoagulum_purple.jpg"
              },
              {
                "id": "212451",
                "name": "Forgiamagie Aberrante",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_aberrantspellforge_pink.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212451",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_aberrantspellforge_pink.jpg"
              },
              {
                "id": "212417",
                "name": "Maschera Oscura dell'Aldilà",
                "type": "Testa Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_leather_raiddemonhunternerubian_d_01_helm.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212417",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_leather_raiddemonhunternerubian_d_01_helm.jpg"
              },
              {
                "id": "212447",
                "name": "Chiave all'Immanifesto",
                "type": "Dito Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_nerubian_ring_02_color5.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212447",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_nerubian_ring_02_color5.jpg"
              },
              {
                "id": "212422",
                "name": "Gambali Corazzati dell'Orrore Vincolasangue",
                "type": "Gambe Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_pant.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212422",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_pant.jpg"
              },
              {
                "id": "212430",
                "name": "Cordone dell'Occhio Infranto",
                "type": "Fianchi Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_cloth_raidmagenerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212430",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_cloth_raidmagenerubian_d_01.jpg"
              },
              {
                "id": "212438",
                "name": "Nastri dello Spettro Inquinato",
                "type": "Polsi Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raidroguenerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212438",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raidroguenerubian_d_01.jpg"
              },
              {
                "id": "212395",
                "name": "Kukri Baciato dal Sangue",
                "type": "Una mano Pugnale",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_nerubianraid_d_02.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212395",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_nerubianraid_d_02.jpg"
              },
              {
                "id": "225590",
                "name": "Stivali del Baluardo Nero",
                "type": "Piedi Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_raiddeathknightnerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225590",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_raiddeathknightnerubian_d_01.jpg"
              },
              {
                "id": "212439",
                "name": "Spallacci della Falsa Alba",
                "type": "Spalle Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidpriestnerubian_d_01_shoulder.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212439",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidpriestnerubian_d_01_shoulder.jpg"
              },
              {
                "id": "212414",
                "name": "Resti del Guardiano Perduto",
                "type": "Fianchi Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mail_raidhunternerubian_d_01_belt.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212414",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mail_raidhunternerubian_d_01_belt.jpg"
              },
              {
                "id": "212404",
                "name": "Scettro del Miasma Manifesto",
                "type": "Una mano Mazza",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_nerubianraid_d_02.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212404",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_nerubianraid_d_02.jpg"
              },
              {
                "id": "212421",
                "name": "Membrana Sporca di Sangue",
                "type": "Torso Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_mail_raidevokernerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212421",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_mail_raidevokernerubian_d_01.jpg"
              }
            ]
          },
          {
            "id": 2599,
            "name": "Sikran, Capitano dei Sureki",
            "loot": [
              {
                "id": "212449",
                "name": "Arsenale Interminabile di Sikran",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_sikransarsenal_purple.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212449",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_sikransarsenal_purple.jpg"
              },
              {
                "id": "212392",
                "name": "Acciaio Danzante del Duellante",
                "type": "Una mano Spada",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212392",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212416",
                "name": "Stivaletti Venati di Cosmico",
                "type": "Piedi Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidwarlocknerubian_d_01_boot.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212416",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidwarlocknerubian_d_01_boot.jpg"
              },
              {
                "id": "212405",
                "name": "Lama Fasica Impeccabile",
                "type": "Una mano Spada",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212405",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212413",
                "name": "Perforatore del Boia Onorato",
                "type": "Due mani Arma ad asta",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212413",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01.jpg"
              },
              {
                "id": "225577",
                "name": "Fregio dello Zelota Sureki",
                "type": "Collo Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_nerubian_necklace_01_color4.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225577",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_nerubian_necklace_01_color4.jpg"
              },
              {
                "id": "225619",
                "name": "Emblema dell'Animoso Mistico",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225619",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01_nv.jpg"
              },
              {
                "id": "225620",
                "name": "Emblema dell'Animoso Venerato",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225620",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01_nv.jpg"
              },
              {
                "id": "212399",
                "name": "Arco Setoso della Scheggia",
                "type": "A distanza Arco",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bow_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212399",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bow_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212427",
                "name": "Maschera del Capitano Asceso",
                "type": "Testa Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_helm.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212427",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_helm.jpg"
              },
              {
                "id": "212445",
                "name": "Calzari con Punte di Chitina",
                "type": "Piedi Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_leather_raiddemonhunternerubian_d_01_boot.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212445",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_leather_raiddemonhunternerubian_d_01_boot.jpg"
              },
              {
                "id": "225618",
                "name": "Emblema dell'Animoso Terrificante",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225618",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01_nv.jpg"
              },
              {
                "id": "225621",
                "name": "Emblema dell'Animoso dello Zenith",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225621",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_nerubianraid_d_01_nv.jpg"
              },
              {
                "id": "212415",
                "name": "Braccialetti del Difensore del Trono",
                "type": "Polsi Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_mail_raidshamannerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212415",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_mail_raidshamannerubian_d_01.jpg"
              }
            ]
          },
          {
            "id": 2609,
            "name": "Rasha'nan",
            "loot": [
              {
                "id": "212453",
                "name": "Organo Corrosivo del Terrore dei Cieli",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_oversizedacidgland_green.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212453",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_oversizedacidgland_green.jpg"
              },
              {
                "id": "212437",
                "name": "Manette del Lampionaio Devastato",
                "type": "Polsi Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_raiddeathknightnerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212437",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_raiddeathknightnerubian_d_01.jpg"
              },
              {
                "id": "212391",
                "name": "Lama da Banchetto del Predatore",
                "type": "Una mano Lame da Guerra",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glaive_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212391",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glaive_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212398",
                "name": "Mazzuola del Vento Rovente",
                "type": "Una mano Mazza",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212398",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "225583",
                "name": "Cinta Erosa del Behemoth",
                "type": "Fianchi Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_leather_raiddemonhunternerubian_d_01_belt.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225583",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_leather_raiddemonhunternerubian_d_01_belt.jpg"
              },
              {
                "id": "212440",
                "name": "Copricapo Scartato del Devoto",
                "type": "Testa Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidwarlocknerubian_d_01_helm.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212440",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidwarlocknerubian_d_01_helm.jpg"
              },
              {
                "id": "212448",
                "name": "Medaglione dei Ricordi Spezzati",
                "type": "Collo Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_nerubian_necklace_02_color3.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212448",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_nerubian_necklace_02_color3.jpg"
              },
              {
                "id": "225586",
                "name": "Ali del Dolore Infranto",
                "type": "Schiena Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_leather_raiddemonhunternerubian_d_01_cape.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225574",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_leather_raiddemonhunternerubian_d_01_cape.jpg"
              }
            ]
          },
          {
            "id": 2612,
            "name": "Mutastirpe Ovi'nax",
            "loot": [
              {
                "id": "212452",
                "name": "Siringa Terrificante",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_gruesomesyringe_red.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212452",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_gruesomesyringe_red.jpg"
              },
              {
                "id": "220305",
                "name": "Uovo Mercuriale di Ovi'nax",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_mercurialegg_purple.jpg",
                "wowhead_url": "https://www.wowhead.com/item=220305",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_mercurialegg_purple.jpg"
              },
              {
                "id": "225576",
                "name": "Anello con Verme Ritorto",
                "type": "Dito Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_qiraj_skinsandworm.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225576",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_qiraj_skinsandworm.jpg"
              },
              {
                "id": "212387",
                "name": "Catalizzatore Tetro del Mutastirpe",
                "type": "Accessorio Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_offhand_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212387",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_offhand_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212418",
                "name": "Iniettori di Sangue Nero",
                "type": "Mani Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_raiddeathknightnerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212418",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_raiddeathknightnerubian_d_01.jpg"
              },
              {
                "id": "212389",
                "name": "Spira degli Orrori Trasfusi",
                "type": "Due mani Bastone",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_staff_2h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212389",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_staff_2h_nerubianraid_d_01.jpg"
              },
              {
                "id": "225580",
                "name": "Cintura a Spirale dell'Ascensione Accelerata",
                "type": "Fianchi Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_mail_raidevokernerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225580",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_mail_raidevokernerubian_d_01.jpg"
              },
              {
                "id": "225588",
                "name": "Bendaggi dell'Esperimento Sanguinario",
                "type": "Polsi Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raidmonknerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225588",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raidmonknerubian_d_01.jpg"
              },
              {
                "id": "225582",
                "name": "Pianelle di Gusci d'Uova Assimilati",
                "type": "Piedi Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_cloth_raidmagenerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225582",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_cloth_raidmagenerubian_d_01.jpg"
              }
            ]
          },
          {
            "id": 2601,
            "name": "Principessa del Nexus Ky'veza",
            "loot": [
              {
                "id": "221023",
                "name": "Trasmittente Infida",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_etherealraid_communicator_color1.jpg",
                "wowhead_url": "https://www.wowhead.com/item=221023",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_etherealraid_communicator_color1.jpg"
              },
              {
                "id": "212456",
                "name": "Contratto della Mietitrice del Vuoto",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_10_inscription2_repcontracts_trade_archaeology_apexisscroll_uprez_color4.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212456",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_10_inscription2_repcontracts_trade_archaeology_apexisscroll_uprez_color4.jpg"
              },
              {
                "id": "219877",
                "name": "Lama Distorta della Mietitrice del Vuoto",
                "type": "Una mano Tirapugni",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_hand_1h_nerubianraid_d_02_blue.jpg",
                "wowhead_url": "https://www.wowhead.com/item=219877",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_hand_1h_nerubianraid_d_02_blue.jpg"
              },
              {
                "id": "225629",
                "name": "Icona dell'Assassino dello Zenith",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225629",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01_nv.jpg"
              },
              {
                "id": "225581",
                "name": "Copripolsi di Ky'veza",
                "type": "Polsi Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mail_raidhunternerubian_d_01_bracer.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225581",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mail_raidhunternerubian_d_01_bracer.jpg"
              },
              {
                "id": "225628",
                "name": "Icona dell'Assassino Venerato",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225628",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01_nv.jpg"
              },
              {
                "id": "225591",
                "name": "Calzari Sfuggenti del Massacro",
                "type": "Piedi Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_leather_raidroguenerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225591",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_leather_raidroguenerubian_d_01.jpg"
              },
              {
                "id": "225636",
                "name": "Regicidio",
                "type": "Una mano Pugnale",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225636",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "225589",
                "name": "Grancintura della Taglia Fatua",
                "type": "Fianchi Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_plate_raidwarriornerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225589",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_plate_raidwarriornerubian_d_01.jpg"
              },
              {
                "id": "212400",
                "name": "Silenziatore Toccato dall'Ombra",
                "type": "A distanza Balestra",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_crossbow_2h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212400",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_crossbow_2h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212441",
                "name": "Manette della Notte Senza Stelle",
                "type": "Mani Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidpriestnerubian_d_01_glove.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212441",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidpriestnerubian_d_01_glove.jpg"
              },
              {
                "id": "225626",
                "name": "Icona dell'Assassino Terrificante",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225626",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01_nv.jpg"
              },
              {
                "id": "225627",
                "name": "Icona dell'Assassino Mistico",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225627",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_nerubianraid_d_01_nv.jpg"
              }
            ]
          },
          {
            "id": 2608,
            "name": "Corte della Seta",
            "loot": [
              {
                "id": "220202",
                "name": "Ragnatela del Maestro delle Spie",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_11_0_raid_spymastersweb_purple.jpg",
                "wowhead_url": "https://www.wowhead.com/item=220202",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_11_0_raid_spymastersweb_purple.jpg"
              },
              {
                "id": "212450",
                "name": "Autorità del Signore dello Sciame",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_swarmlordsauthority_purple.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212450",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_swarmlordsauthority_purple.jpg"
              },
              {
                "id": "212397",
                "name": "Editto Entropico di Takazj",
                "type": "Due mani Bastone",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_staff_2h_nerubianraid_d_02.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212397",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_staff_2h_nerubianraid_d_02.jpg"
              },
              {
                "id": "225584",
                "name": "Polsiere Duplici del Tessigrovigli",
                "type": "Polsi Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_cloth_raidmagenerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225584",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_cloth_raidmagenerubian_d_01.jpg"
              },
              {
                "id": "212407",
                "name": "Mandibola Colossale di Anub'arash",
                "type": "Due mani Ascia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_axe_2h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212407",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_axe_2h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212443",
                "name": "Schinieri Frangigusci",
                "type": "Piedi Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_boot.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212443",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_boot.jpg"
              },
              {
                "id": "225624",
                "name": "Distintivo del Connivente Venerato",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225624",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02_nv.jpg"
              },
              {
                "id": "212429",
                "name": "Guardaspalle della Luce del Vuoto Sussurrante",
                "type": "Spalle Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_mail_raidevokernerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212429",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_mail_raidevokernerubian_d_01.jpg"
              },
              {
                "id": "212432",
                "name": "Impalatori dalle Mille Cicatrici",
                "type": "Mani Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_leather_raiddruidnerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212432",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_leather_raiddruidnerubian_d_01.jpg"
              },
              {
                "id": "225622",
                "name": "Distintivo del Connivente Terrificante",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225622",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02_nv.jpg"
              },
              {
                "id": "225575",
                "name": "Favore del Consigliere di Seta",
                "type": "Collo Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_11_0_nerubian_necklace_02_color5.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225575",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_11_0_nerubian_necklace_02_color5.jpg"
              },
              {
                "id": "225623",
                "name": "Distintivo del Connivente Mistico",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225623",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02_nv.jpg"
              },
              {
                "id": "225625",
                "name": "Distintivo del Connivente dello Zenith",
                "type": "Non equipaggiabile Cianfrusaglie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02_nv.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225625",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_02_nv.jpg"
              }
            ]
          },
          {
            "id": 2602,
            "name": "Regina Ansurek",
            "loot": [
              {
                "id": "212454",
                "name": "Mandato della Regina Folle",
                "type": "Monile Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_abyssaleffigy_purple.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212454",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_raid_abyssaleffigy_purple.jpg"
              },
              {
                "id": "225579",
                "name": "Scudo con Emblema della Despota Caustica",
                "type": "Mano secondaria Scudo",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225579",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "212394",
                "name": "Disdegno del Sovrano",
                "type": "Una mano Pugnale",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_nerubianraid_d_02.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212394",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_nerubianraid_d_02.jpg"
              },
              {
                "id": "212436",
                "name": "Grinfie della Paranoia",
                "type": "Mani Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_mail_raidshamannerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212436",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_mail_raidshamannerubian_d_01.jpg"
              },
              {
                "id": "212420",
                "name": "Carapace della Guardia della Regina",
                "type": "Torso Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_plate_raidwarriornerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212420",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_plate_raidwarriornerubian_d_01.jpg"
              },
              {
                "id": "225578",
                "name": "Anello con Sigillo del Patto Avvelenato",
                "type": "Dito Varie",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_nerubian_ring_01_color3.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225578",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_nerubian_ring_01_color3.jpg"
              },
              {
                "id": "212433",
                "name": "Camuffamento Velenoso dell'Onnivoro",
                "type": "Torso Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_leather_raiddruidnerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212433",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_leather_raiddruidnerubian_d_01.jpg"
              },
              {
                "id": "212434",
                "name": "Sarong Chiamavuoto",
                "type": "Gambe Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_pant_cloth_raidmagenerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212434",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_pant_cloth_raidmagenerubian_d_01.jpg"
              },
              {
                "id": "212401",
                "name": "Giudizio Finale di Ansurek",
                "type": "Una mano Ascia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_axe_1h_nerubianraid_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212401",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_axe_1h_nerubianraid_d_01.jpg"
              },
              {
                "id": "225585",
                "name": "Fascia dell'Ascendente Acre",
                "type": "Fianchi Stoffa",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidpriestnerubian_d_01_belt.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225585",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidpriestnerubian_d_01_belt.jpg"
              },
              {
                "id": "212444",
                "name": "Spallacci Incorniciati degli Insorti Caduti",
                "type": "Spalle Cuoio",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_leather_raidmonknerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212444",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_leather_raidmonknerubian_d_01.jpg"
              },
              {
                "id": "212435",
                "name": "Gambiere del Deflettore Liquefatto",
                "type": "Gambe Maglia",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_robe_mail_raidshamannerubian_d_01.jpg",
                "wowhead_url": "https://www.wowhead.com/item=212435",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_robe_mail_raidshamannerubian_d_01.jpg"
              },
              {
                "id": "225587",
                "name": "Polsiere di Ferro delle Offerte Devote",
                "type": "Polsi Piastre",
                "ilvl": 571,
                "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_bracer.jpg",
                "wowhead_url": "https://www.wowhead.com/item=225587",
                "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_bracer.jpg"
              }
            ]
          }
        ],
        "difficulties": [
          {
            "name": "Looking For Raid",
            "ilvl": 584
          },
          {
            "name": "Normal",
            "ilvl": 597
          },
          {
            "name": "Heroic",
            "ilvl": 610
          },
          {
            "name": "Mythic",
            "ilvl": 623
          }
        ],
        "missingItems": [],
        "filteredItems": [
          {
            "id": 223097,
            "name": "Modello: Fibbia dell'Impeto Adrenalinico",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:27.920Z"
          },
          {
            "id": 224435,
            "name": "Modello: Imbottitura di Fildivespro",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:30.413Z"
          },
          {
            "id": 225632,
            "name": "Idolo dell'Oscenità Venerata",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:30.533Z"
          },
          {
            "id": 225631,
            "name": "Idolo dell'Oscenità Mistica",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:30.973Z"
          },
          {
            "id": 225630,
            "name": "Idolo dell'Oscenità Terrificante",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:31.410Z"
          },
          {
            "id": 225633,
            "name": "Idolo dell'Oscenità dello Zenith",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:31.840Z"
          },
          {
            "id": 226190,
            "name": "Ricetta: Dolcetto Appiccicaticcio",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:32.667Z"
          },
          {
            "id": 225616,
            "name": "Effige del Blasfemo Venerato",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:33.264Z"
          },
          {
            "id": 225615,
            "name": "Effige del Blasfemo Mistico",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:33.355Z"
          },
          {
            "id": 225617,
            "name": "Effige del Blasfemo dello Zenith",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:33.917Z"
          },
          {
            "id": 225614,
            "name": "Effige del Blasfemo Terrificante",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:33.998Z"
          },
          {
            "id": 223048,
            "name": "Progetto: Stiletto Aspirante",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:34.849Z"
          },
          {
            "id": 223094,
            "name": "Modello: Castone dell'Orefice Magnifico",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:37.068Z"
          },
          {
            "id": 223144,
            "name": "Formula: Incantamento Arma - Autorità delle Profondità",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:39.276Z"
          },
          {
            "id": 225634,
            "name": "Reperto Avvolto nella Ragnatela",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:40.682Z"
          },
          {
            "id": 224147,
            "name": "Redini dello Sferzacieli Sureki",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:41.402Z"
          },
          {
            "id": 224151,
            "name": "Redini dello Sferzacieli Asceso",
            "type": "NON_EQUIP",
            "timestamp": "2025-02-03T23:46:41.504Z"
          }
        ]
      }
}

async function initializeDatabase(customPath) {
    // Set a default database path if no path is provided
    const defaultDatabasePath = path.resolve(__dirname, '../database');
    const databasePath = customPath || process.env.DATABASE_PATH || defaultDatabasePath;

    console.log('Initializing database with path:', databasePath);

    // Validate that databasePath is a string
    if (typeof databasePath !== 'string') {
        console.error('Invalid database path:', databasePath);
        throw new Error(`Database path must be a string. Received: ${typeof databasePath}`);
    }

    try {
        // Ensure the database directory exists
        await fs.mkdir(databasePath, { recursive: true });

        console.log('Starting comprehensive database initialization...');
        
        // Ensure all required files exist
        await initializeDatabaseFiles(databasePath);
        
        console.log(`Database successfully initialized at: ${databasePath}`);
        
        return databasePath;
    } catch (error) {
        console.error('Critical error during database initialization:', error);
        throw error;
    }
}

async function initializeDatabaseFiles(databasePath) {
    console.time('Database Initialization');
    console.log(`Starting comprehensive database file initialization in ${databasePath}`);

    // Specific path for raid loot file
    const raidLootPath = path.join(databasePath, 'raid-loot.json');
    
    try {
        // Check if file exists and has content
        let existingData;
        try {
            existingData = await fs.readFile(raidLootPath, 'utf8').trim();
        } catch (readError) {
            // File doesn't exist, will use hardcoded data
            existingData = '';
        }

        // Only write hardcoded data if file is empty or doesn't exist
        if (!existingData) {
            console.log('Raid loot file is empty or missing. Using hardcoded data.');
            const hardcodedRaidLootData = getHardcodedRaidLootData();
            
            // Ensure database directory exists
            await fs.mkdir(path.dirname(raidLootPath), { recursive: true });
            
            // Write hardcoded data
            await fs.writeFile(raidLootPath, JSON.stringify(hardcodedRaidLootData, null, 2));
            
            console.log('Wrote hardcoded raid loot data to:', raidLootPath);
        } else {
            console.log('Existing raid loot data found. Skipping hardcoded data.');
            
            // Optional: Parse and log existing data for verification
            try {
                const existingParsedData = JSON.parse(existingData);
                console.log('Existing data contains:', existingParsedData.bosses ? `${existingParsedData.bosses.length} bosses` : 'No bosses');
            } catch (parseError) {
                console.error('Error parsing existing raid loot data:', parseError);
            }
        }
    } catch (error) {
        console.error('Error initializing raid loot data:', error);
        throw error;
    }

    // Continue with other database file initializations if needed
    for (const filename of Object.keys(DEFAULT_CONTENTS)) {
        if (filename === 'raid-loot.json') {
            continue;
        }
        
        const filePath = path.join(databasePath, filename);
        
        try {
            // Check if file exists
            try {
                await fs.access(filePath);
                console.log(`File ${filename} already exists`);
            } catch {
                // File doesn't exist, create it with default content
                const defaultContent = DEFAULT_CONTENTS[filename];
                await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
                console.log(`Created default ${filename}`);
            }
        } catch (error) {
            console.error(`Critical error initializing ${filename}:`, error);
            throw error;
        }
    }

    // Generate comprehensive boss loot images after database is initialized
    try {
        const raidLootData = getHardcodedRaidLootData();
        const bosses = raidLootData.bosses;

        console.log(`Preparing to generate comprehensive loot images for ${bosses.length} bosses...`);
        console.time('Boss Loot Image Generation');
        
        const lootImageGenerationResults = await ImageComposer.generateComprehensiveBossLootImages(bosses);

        console.timeEnd('Boss Loot Image Generation');
        console.log('Boss Comprehensive Loot Image Generation Summary:');
        console.log('Generated:', lootImageGenerationResults.filter(r => r.status === 'generated').length);
        console.log('Skipped:', lootImageGenerationResults.filter(r => r.status === 'skipped').length);
        console.log('Failed:', lootImageGenerationResults.filter(r => r.status === 'failed').length);

        const failedBosses = lootImageGenerationResults.filter(r => r.status === 'failed');
        if (failedBosses.length > 0) {
            console.warn('Failed to generate comprehensive loot images for these bosses:', 
                failedBosses.map(boss => boss.boss).join(', ')
            );
        }

        console.timeEnd('Database Initialization');
    } catch (error) {
        console.error('Error during comprehensive boss loot image generation:', error);
    }
}

async function getDatabaseStats(databasePath) {
    const files = await fs.readdir(databasePath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    let totalEntries = 0;
    for (const file of jsonFiles) {
        const filePath = path.join(databasePath, file);
        const content = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Count entries based on common structures
        if (content.reservations) totalEntries += content.reservations.length;
        if (content.birthdays) totalEntries += content.birthdays.length;
        if (content.leagues) totalEntries += content.leagues.length;
    }
    
    return {
        totalFiles: jsonFiles.length,
        totalEntries
    };
}

module.exports = { initializeDatabase };
