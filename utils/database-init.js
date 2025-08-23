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
    'raid-loot.json': getHardcodedRaidLootData()
};

const EXACT_COPY_FILES = [
    'raid-loot.json'
];

function getHardcodedRaidLootData() {
    return {
      "raid": "Liberazione di Cavafonda",
      "bosses": [
        {
          "id": 2639,
          "name": "Vexie e i Pestaruote",
          "loot": [
            {
              "id": "228876",
              "name": "Ultimo Giro del Dragster",
              "type": "Piedi Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_leather_raidroguegoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228876",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_leather_raidroguegoblin_d_01.jpg"
            },
            {
              "id": "231268",
              "name": "Machete Furioso",
              "type": "Una mano Spada",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=231268",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228875",
              "name": "Rivestimento Cranico del Vandalo",
              "type": "Spalle Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_leather_raiddemonhuntergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228875",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_leather_raiddemonhuntergoblin_d_01.jpg"
            },
            {
              "id": "228858",
              "name": "Casco a Tuttabirra",
              "type": "Testa Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladingoblin_d_01_helm.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228858",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladingoblin_d_01_helm.jpg"
            },
            {
              "id": "228862",
              "name": "Calzari Imbottiti di Schegge",
              "type": "Piedi Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_mail_raidevokergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228862",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_mail_raidevokergoblin_d_01.jpg"
            },
            {
              "id": "228861",
              "name": "Cintura di Attrezzi Messa a Punto",
              "type": "Fianchi Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_belt.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228861",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_belt.jpg"
            },
            {
              "id": "228892",
              "name": "Cambio dello Svalvolatore",
              "type": "Due mani Bastone",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_staff_2h_goblinraid_d_02.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228892",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_staff_2h_goblinraid_d_02.jpg"
            },
            {
              "id": "228839",
              "name": "Bandiera a Scacchi del Sottocircuito",
              "type": "Schiena Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_cape.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228839",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_cape.jpg"
            },
            {
              "id": "228865",
              "name": "Sottogonna del Dottore della Fossa",
              "type": "Gambe Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_pant_cloth_raidpriestgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228865",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_pant_cloth_raidpriestgoblin_d_01.jpg"
            },
            {
              "id": "230197",
              "name": "Chiavi di Scorta di Pestaruote",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblintrikekeychain_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230197",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblintrikekeychain_gallywix.jpg"
            },
            {
              "id": "228852",
              "name": "Giacca della Gloria",
              "type": "Torso Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_mail_raidevokergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228852",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_mail_raidevokergoblin_d_01.jpg"
            },
            {
              "id": "228868",
              "name": "Avambracci Accelerati",
              "type": "Polsi Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raiddeathknightgoblin_d_01_bracer.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228868",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raiddeathknightgoblin_d_01_bracer.jpg"
            },
            {
              "id": "230019",
              "name": "Fischietto della Fossa di Vexie",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_sapper_bilgewater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230019",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_sapper_bilgewater.jpg"
            }
          ]
        },
        {
          "id": 2640,
          "name": "Calderone del Massacro",
          "loot": [
            {
              "id": "230191",
              "name": "Fiamma Pilota di Motorendo",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_flarendosflame_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230191",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_flarendosflame_gallywix.jpg"
            },
            {
              "id": "230190",
              "name": "Grosso Pulsante Rosso di Torq",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_redbutton_bilgewater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230190",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_redbutton_bilgewater.jpg"
            },
            {
              "id": "228890",
              "name": "Canestro del Superfan",
              "type": "Accessorio Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_offhand_1h_goblinraid_d_02.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228890",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_offhand_1h_goblinraid_d_02.jpg"
            },
            {
              "id": "228904",
              "name": "Favorito dalla Folla",
              "type": "Una mano Tirapugni",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_hand_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228904",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_hand_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228803",
              "name": "Gallybux Insanguinato Terrificante",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_bilgewater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228803",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_bilgewater.jpg"
            },
            {
              "id": "228873",
              "name": "Cintura del Titolo dei Pesi Massimissimi",
              "type": "Fianchi Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_plate_raidwarriorgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228873",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_plate_raidwarriorgoblin_d_01.jpg"
            },
            {
              "id": "228900",
              "name": "Arco del Torneo",
              "type": "A distanza Arco",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bow_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228900",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bow_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228805",
              "name": "Gallybux Insanguinato Venerato",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_bilgewater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228805",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_bilgewater.jpg"
            },
            {
              "id": "228856",
              "name": "Fascione da Battaglia del Concorrente",
              "type": "Fianchi Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_leather_raiddruidgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228856",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_leather_raiddruidgoblin_d_01.jpg"
            },
            {
              "id": "228840",
              "name": "Anello del Campione Scomparso",
              "type": "Dito Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_ring_bilgewater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228840",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_ring_bilgewater.jpg"
            },
            {
              "id": "228846",
              "name": "Polsiere con Graffiti Galvanici",
              "type": "Polsi Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_mail_raidshamangoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228846",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_mail_raidshamangoblin_d_01.jpg"
            },
            {
              "id": "228806",
              "name": "Gallybux Insanguinato dello Zenith",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_bilgewater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228806",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_bilgewater.jpg"
            },
            {
              "id": "228804",
              "name": "Gallybux Insanguinato Mistico",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_bilgewater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228804",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_bilgewater.jpg"
            },
            {
              "id": "228847",
              "name": "Giratalloni Caldi",
              "type": "Piedi Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_cloth_raidpriestgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228847",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_cloth_raidpriestgoblin_d_01.jpg"
            }
          ]
        },
        {
          "id": 2641,
          "name": "Rik Riverbero",
          "loot": [
            {
              "id": "228845",
              "name": "Fascia della Diva Feroce",
              "type": "Fianchi Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_mail_raidevokergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228845",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_mail_raidevokergoblin_d_01.jpg"
            },
            {
              "id": "228815",
              "name": "Gallybux Lucidato Terrificante",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_ventureco.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228815",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_ventureco.jpg"
            },
            {
              "id": "228897",
              "name": "Sparachiodi Pirotecnici",
              "type": "Una mano Pugnale",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_goblinraid_d_02.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228897",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_goblinraid_d_02.jpg"
            },
            {
              "id": "228895",
              "name": "Sciabola a Iniezione Remixata",
              "type": "Una mano Spada",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228895",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_sword_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228816",
              "name": "Gallybux Lucidato Mistico",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_ventureco.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228816",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_ventureco.jpg"
            },
            {
              "id": "228857",
              "name": "Braccialetto d'Ingresso alla Sottofesta",
              "type": "Polsi Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_bracer.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228857",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_bracer.jpg"
            },
            {
              "id": "228841",
              "name": "Amuleto Semiammaliato",
              "type": "Collo Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_necklace_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228841",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_necklace_gallywix.jpg"
            },
            {
              "id": "230194",
              "name": "Radio Riverbero",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_statsoundwaveemitter_blackwater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230194",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_statsoundwaveemitter_blackwater.jpg"
            },
            {
              "id": "228817",
              "name": "Gallybux Lucidato Venerato",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_ventureco.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228817",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_ventureco.jpg"
            },
            {
              "id": "228818",
              "name": "Gallybux Lucidato dello Zenith",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_ventureco.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228818",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_ventureco.jpg"
            },
            {
              "id": "228869",
              "name": "Tremapolsi della Regina Assassina",
              "type": "Polsi Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raiddruidgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228869",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raiddruidgoblin_d_01.jpg"
            },
            {
              "id": "228874",
              "name": "Stivali da Passeggio di Rik",
              "type": "Piedi Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raiddeathknightgoblin_d_01_boot.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228874",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raiddeathknightgoblin_d_01_boot.jpg"
            },
            {
              "id": "231311",
              "name": "Muro Meraviglioso del Capobanda",
              "type": "Mano secondaria Scudo",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=231311",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_goblinraid_d_01.jpg"
            }
          ]
        },
        {
          "id": 2642,
          "name": "Stix Tritabrande",
          "loot": [
            {
              "id": "228896",
              "name": "Rilevatore di Metalli di Stix",
              "type": "Una mano Pugnale",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228896",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228854",
              "name": "Pantaloni Scartati dei Ratti di Sentina",
              "type": "Gambe Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_pant_leather_raidmonkgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228854",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_pant_leather_raidmonkgoblin_d_01.jpg"
            },
            {
              "id": "228813",
              "name": "Gallybux Arrugginito Venerato",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_blackwater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228813",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_blackwater.jpg"
            },
            {
              "id": "228812",
              "name": "Gallybux Arrugginito Mistico",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_blackwater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228812",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_blackwater.jpg"
            },
            {
              "id": "228849",
              "name": "Compattatori Meccanici",
              "type": "Mani Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_plate_raidwarriorgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228849",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_plate_raidwarriorgoblin_d_01.jpg"
            },
            {
              "id": "228811",
              "name": "Gallybux Arrugginito Terrificante",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_blackwater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228811",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_blackwater.jpg"
            },
            {
              "id": "228814",
              "name": "Gallybux Arrugginito dello Zenith",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_blackwater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228814",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_blackwater.jpg"
            },
            {
              "id": "228903",
              "name": "Sciacallo dei Rifiuti",
              "type": "Due mani Ascia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_axe_2h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228903",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_axe_2h_goblinraid_d_01.jpg"
            },
            {
              "id": "230189",
              "name": "Megamagnete della Maestra dei Rottami",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_magnet_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230189",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_magnet_gallywix.jpg"
            },
            {
              "id": "228871",
              "name": "Maschera da Rifiuti della Squadra di Pulizia",
              "type": "Testa Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_helm.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228871",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_helm.jpg"
            },
            {
              "id": "228859",
              "name": "Cappuccio di Scarti Sanitizzato",
              "type": "Testa Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_helm_mail_raidshamangoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228859",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_helm_mail_raidshamangoblin_d_01.jpg"
            },
            {
              "id": "230026",
              "name": "Scartacampo 9001",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_forcefieldmodule_steamwheedle.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230026",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_forcefieldmodule_steamwheedle.jpg"
            }
          ]
        },
        {
          "id": 2653,
          "name": "Ingraniere Lockenstock",
          "loot": [
            {
              "id": "228799",
              "name": "Gallybux Oliato Terrificante",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_steamwheedle.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228799",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_steamwheedle.jpg"
            },
            {
              "id": "228894",
              "name": "Motolama della GIGAMORTE",
              "type": "Una mano Lame da Guerra",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glaive_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228894",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glaive_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228884",
              "name": "Polsiere della Cavia",
              "type": "Polsi Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladingoblin_d_01_bracer.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228884",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladingoblin_d_01_bracer.jpg"
            },
            {
              "id": "228802",
              "name": "Gallybux Oliato dello Zenith",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_steamwheedle.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228802",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_steamwheedle.jpg"
            },
            {
              "id": "228867",
              "name": "Paramani Attira-Porcherie",
              "type": "Mani Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_mail_raidhuntergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228867",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_mail_raidhuntergoblin_d_01.jpg"
            },
            {
              "id": "228898",
              "name": "Bastone Badabum Alfalimentato",
              "type": "Due mani Bastone",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_staff_2h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228898",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_staff_2h_goblinraid_d_01.jpg"
            },
            {
              "id": "228800",
              "name": "Gallybux Oliato Mistico",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_steamwheedle.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228800",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_steamwheedle.jpg"
            },
            {
              "id": "228844",
              "name": "Zaino Razzo di Prova del Pilota",
              "type": "Schiena Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cape_special_mechanicalflyer_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228844",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cape_special_mechanicalflyer_d_01.jpg"
            },
            {
              "id": "228882",
              "name": "Nastro Trasportatore del Raffinatore",
              "type": "Fianchi Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_cloth_raidpriestgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228882",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_cloth_raidpriestgoblin_d_01.jpg"
            },
            {
              "id": "228801",
              "name": "Gallybux Oliato Venerato",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_steamwheedle.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228801",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_steamwheedle.jpg"
            },
            {
              "id": "230186",
              "name": "Signor Polveri-Al-Fuoco",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_healraydrone_bilgewater.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230186",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_healraydrone_bilgewater.jpg"
            },
            {
              "id": "228888",
              "name": "Pubblicatori di Beta Affrettate",
              "type": "Piedi Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_leather_raidmonkgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228888",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_leather_raidmonkgoblin_d_01.jpg"
            },
            {
              "id": "230193",
              "name": "Signor Fuoco-Alle-Polveri",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_healraydrone_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230193",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_healraydrone_gallywix.jpg"
            }
          ]
        },
        {
          "id": 2644,
          "name": "Bandito con un Braccio Solo",
          "loot": [
            {
              "id": "230188",
              "name": "Servizio in Bottiglia del Gallagio",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_underminegangsterdisguise.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230188",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_underminegangsterdisguise.jpg"
            },
            {
              "id": "230027",
              "name": "Castello di Carte",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_gallyjack_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230027",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_gallyjack_gallywix.jpg"
            },
            {
              "id": "228886",
              "name": "Cinturone a Gettoni",
              "type": "Fianchi Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladingoblin_d_01_belt.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228886",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladingoblin_d_01_belt.jpg"
            },
            {
              "id": "228885",
              "name": "Polsiere delle Puntate del Delinquente",
              "type": "Polsi Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raiddemonhuntergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228885",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raiddemonhuntergoblin_d_01.jpg"
            },
            {
              "id": "228883",
              "name": "Scarpe da Tavolo Dubbiose",
              "type": "Piedi Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_mail_raidhuntergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228883",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_mail_raidhuntergoblin_d_01.jpg"
            },
            {
              "id": "228906",
              "name": "Individuatore di Frodi dell'Operatore",
              "type": "Accessorio Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_offhand_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228906",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_offhand_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228905",
              "name": "Svaligia-Banche Gigante",
              "type": "Due mani Arma ad asta",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228905",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_polearm_2h_goblinraid_d_01.jpg"
            },
            {
              "id": "228807",
              "name": "Gallybux Dorato Terrificante",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228807",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_gallywix.jpg"
            },
            {
              "id": "228810",
              "name": "Gallybux Dorato dello Zenith",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228810",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_gallywix.jpg"
            },
            {
              "id": "228850",
              "name": "Blusa dell'Ultimo Dollaro",
              "type": "Torso Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_robe.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228850",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_cloth_raidmagegoblin_d_01_robe.jpg"
            },
            {
              "id": "228808",
              "name": "Gallybux Dorato Mistico",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228808",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_gallywix.jpg"
            },
            {
              "id": "231266",
              "name": "Perforatore Numerico Casuale",
              "type": "Una mano Pugnale",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=231266",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_knife_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228809",
              "name": "Gallybux Dorato Venerato",
              "type": "Non equipaggiabile Cianfrusaglie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228809",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_goblincasinochips_gallywix.jpg"
            },
            {
              "id": "228843",
              "name": "Ruota di Roulette in Miniatura",
              "type": "Dito Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_11_0_ventureco_ring01_color3.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228843",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_11_0_ventureco_ring01_color3.jpg"
            },
            {
              "id": "232526",
              "name": "Leva della Slot",
              "type": "Due mani Mazza",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_2h_goblinraid_d_02.jpg",
              "wowhead_url": "https://www.wowhead.com/item=232526",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_2h_goblinraid_d_02.jpg"
            }
          ]
        },
        {
          "id": 2645,
          "name": "Mug'zee, Capi della Sicurezza",
          "loot": [
            {
              "id": "228863",
              "name": "Dita Appiccicose dell'Esecutore",
              "type": "Mani Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_leather_raiddemonhuntergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228863",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_leather_raiddemonhuntergoblin_d_01.jpg"
            },
            {
              "id": "228893",
              "name": "\"Amichetto\"",
              "type": "A distanza Arma da fuoco",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_firearm_2h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228893",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_firearm_2h_goblinraid_d_01.jpg"
            },
            {
              "id": "228853",
              "name": "Gambali Foderati dello Scagnozzo Mercenario",
              "type": "Gambe Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raiddeathknightgoblin_d_01_pant.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228853",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raiddeathknightgoblin_d_01_pant.jpg"
            },
            {
              "id": "228870",
              "name": "Coprispalle Sartoriali del Vicecapo",
              "type": "Spalle Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_cloth_raidpriestgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228870",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_cloth_raidpriestgoblin_d_01.jpg"
            },
            {
              "id": "228860",
              "name": "Spalline degli Esecutori Falliti",
              "type": "Spalle Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_mail_raidhuntergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228860",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_mail_raidhuntergoblin_d_01.jpg"
            },
            {
              "id": "228851",
              "name": "Cotta a \"Prova di Proiettile\"",
              "type": "Torso Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raiddeathknightgoblin_d_01_chest.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228851",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raiddeathknightgoblin_d_01_chest.jpg"
            },
            {
              "id": "228879",
              "name": "Pinne da Murloc di Cemento",
              "type": "Piedi Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_cloth_raidwarlockgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228879",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_cloth_raidwarlockgoblin_d_01.jpg"
            },
            {
              "id": "228901",
              "name": "Mazzuola del Gran Lavoratore",
              "type": "Una mano Mazza",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228901",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228880",
              "name": "Fondina del Sicario",
              "type": "Fianchi Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_leather_raidroguegoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228880",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_leather_raidroguegoblin_d_01.jpg"
            },
            {
              "id": "228878",
              "name": "Manette Artigianali",
              "type": "Polsi Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_mail_raidevokergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228878",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_mail_raidevokergoblin_d_01.jpg"
            },
            {
              "id": "230199",
              "name": "Linea Diretta Criminale di Zee",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_remotecontrol_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230199",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_remotecontrol_gallywix.jpg"
            },
            {
              "id": "228842",
              "name": "Collana Regalo del Padrino Goblin",
              "type": "Collo Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_11_0_ventureco_necklace01_color2.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228842",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_11_0_ventureco_necklace01_color2.jpg"
            },
            {
              "id": "228902",
              "name": "Offerta Rifiutata del Saggio",
              "type": "Una mano Mazza",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_goblinraid_d_02.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228902",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_goblinraid_d_02.jpg"
            },
            {
              "id": "230192",
              "name": "Contenitore Grintoso di Mug",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_blackbloodfueledcontainer.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230192",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_blackbloodfueledcontainer.jpg"
            },
            {
              "id": "232804",
              "name": "Paranocche Fuse di Capo",
              "type": "Una mano Tirapugni",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_hand_1h_ogresecurityboss_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=232804",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_hand_1h_ogresecurityboss_d_01.jpg"
            }
          ]
        },
        {
          "id": 2646,
          "name": "Re Cromato Gallywix",
          "loot": [
            {
              "id": "228899",
              "name": "Pollice di Ferro di Gallywix",
              "type": "Una mano Mazza",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228899",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228848",
              "name": "Tricorno del Malvivente Micciascura",
              "type": "Testa Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_helm_leather_raidroguegoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228848",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_helm_leather_raidroguegoblin_d_01.jpg"
            },
            {
              "id": "228887",
              "name": "Stivalacci da Competizione dei Tagliagole",
              "type": "Piedi Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_plate_raidwarriorgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228887",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_boot_plate_raidwarriorgoblin_d_01.jpg"
            },
            {
              "id": "228877",
              "name": "Catena Avara del Fornitore",
              "type": "Fianchi Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_mail_raidhuntergoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228877",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_belt_mail_raidhuntergoblin_d_01.jpg"
            },
            {
              "id": "231265",
              "name": "Diamante di Jastor",
              "type": "Dito Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_jewelry_ring_63.jpg",
              "wowhead_url": "https://www.wowhead.com/item=231265",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_jewelry_ring_63.jpg"
            },
            {
              "id": "228881",
              "name": "Bracciali dei Finanziamenti Illeciti",
              "type": "Polsi Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_cloth_raidwarlockgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228881",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_cloth_raidwarlockgoblin_d_01.jpg"
            },
            {
              "id": "230198",
              "name": "Occhio di Kezan",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/spell_azerite_essence08.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230198",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/spell_azerite_essence08.jpg"
            },
            {
              "id": "228889",
              "name": "Scudo Titanico Industriale",
              "type": "Mano secondaria Scudo",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228889",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shield_1h_goblinraid_d_01.jpg"
            },
            {
              "id": "228866",
              "name": "Pantaloni dalle Tasche Profonde",
              "type": "Gambe Maglia",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_pants_mail_raidshamangoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228866",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_pants_mail_raidshamangoblin_d_01.jpg"
            },
            {
              "id": "228855",
              "name": "Paraspalle Fruttuosi",
              "type": "Spalle Piastre",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_plate_raidwarriorgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228855",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_plate_raidwarriorgoblin_d_01.jpg"
            },
            {
              "id": "230029",
              "name": "Tuta da Artificiere Cromobustibile",
              "type": "Monile Varie",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_bombsuit_gallywix.jpg",
              "wowhead_url": "https://www.wowhead.com/item=230029",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_111_bombsuit_gallywix.jpg"
            },
            {
              "id": "228891",
              "name": "Punitore Capitale",
              "type": "Due mani Mazza",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_2h_goblinraid_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228891",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_mace_2h_goblinraid_d_01.jpg"
            },
            {
              "id": "228872",
              "name": "Stringimani Dorato",
              "type": "Mani Stoffa",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_cloth_raidpriestgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228872",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_glove_cloth_raidpriestgoblin_d_01.jpg"
            },
            {
              "id": "228864",
              "name": "Uniforme del Cartello \"Ottimizzata\"",
              "type": "Torso Cuoio",
              "ilvl": 623,
              "icon": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_leather_raidmonkgoblin_d_01.jpg",
              "wowhead_url": "https://www.wowhead.com/item=228864",
              "image_url": "https://render.worldofwarcraft.com/eu/icons/56/inv_chest_leather_raidmonkgoblin_d_01.jpg"
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
          "id": 223048,
          "name": "Progetto: Stiletto Aspirante",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:34:59.290Z"
        },
        {
          "id": 224435,
          "name": "Modello: Imbottitura di Fildivespro",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:03.346Z"
        },
        {
          "id": 236687,
          "name": "Pietra del Ritorno Esplosiva",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:06.792Z"
        },
        {
          "id": 223097,
          "name": "Modello: Fibbia dell'Impeto Adrenalinico",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:07.202Z"
        },
        {
          "id": 223094,
          "name": "Modello: Castone dell'Orefice Magnifico",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:11.319Z"
        },
        {
          "id": 223144,
          "name": "Formula: Incantamento Arma - Autorità delle Profondità",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:13.681Z"
        },
        {
          "id": 223144,
          "name": "Formula: Incantamento Arma - Autorità delle Profondità",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:13.750Z"
        },
        {
          "id": 223144,
          "name": "Formula: Incantamento Arma - Autorità delle Profondità",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:13.812Z"
        },
        {
          "id": 223144,
          "name": "Formula: Incantamento Arma - Autorità delle Profondità",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:13.870Z"
        },
        {
          "id": 228819,
          "name": "Ninnolo Eccessivamente Ingioiellato",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:14.900Z"
        },
        {
          "id": 236960,
          "name": "Prototipo A.S.M.R.",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:16.037Z"
        },
        {
          "id": 235626,
          "name": "Chiavi del Grande G",
          "type": "NON_EQUIP",
          "timestamp": "2025-03-03T16:35:16.108Z"
        }
      ]
    }
}

async function initializeDatabase(customPath) {
    // Set a default database path if no path is provided
    const defaultDatabasePath = path.resolve(__dirname, '../database');
    const databasePath = customPath || process.env.DATABASE_PATH || defaultDatabasePath;

    console.log('databasePath: ', databasePath);

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
    }
    
    return {
        totalFiles: jsonFiles.length,
        totalEntries
    };
}

module.exports = { initializeDatabase };
