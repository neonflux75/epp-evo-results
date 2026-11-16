import os
import sys
import json
import math
import time
import urllib.request
import urllib.parse
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "assets", "tracks")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Repository GitHub bacinger/f1-circuits (ha già molti circuiti reali puliti, inclusi Imola, Fuji, Paul Ricard, Nurburgring GP, ecc.)
F1_CIRCUITS_BASE = "https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/"

# 2. Mirror multipli di Overpass API per evitare HTTP 502 / Timeout
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
]

# Elenco completo circuiti Kunos (Assetto Corsa EVO / ACC / AC)
# Formato: (Nome Display, [alias_file], f1_geojson_id_o_None, (lat, lon, raggio_metri), osm_query_name)
CIRCUITI_KUNOS = [
    ("Autodromo Internazionale Enzo e Dino Ferrari (Imola)", ["imola", "ks_imola", "autodromo_internazionale_enzo_e_dino_ferrari"], "it-1953", (44.3439, 11.7167, 1800), "Autodromo Internazionale Enzo e Dino Ferrari"),
    ("Autodromo Nazionale Monza", ["monza", "ks_monza", "autodromo_nazionale_monza"], "it-1922", (45.6190, 9.2811, 2200), "Autodromo Nazionale Monza"),
    ("Circuit de Spa-Francorchamps", ["spa", "ks_spa", "circuit_de_spa_francorchamps"], "be-1925", (50.4372, 5.9714, 2500), "Circuit de Spa-Francorchamps"),
    ("Brands Hatch", ["brands_hatch", "ks_brands_hatch", "brands_hatch_gp"], "gb-1950", (51.3569, 0.2630, 1500), "Brands Hatch"),
    ("Brands Hatch Indy", ["brands_hatch_indy", "ks_brands_hatch_indy"], None, (51.3592, 0.2605, 900), "Brands Hatch"),
    ("WeatherTech Raceway Laguna Seca", ["laguna_seca", "ks_laguna_seca", "weathertech_raceway_laguna_seca"], None, (36.5842, -121.7534, 1500), "Laguna Seca"),
    ("Suzuka International Racing Course", ["suzuka", "ks_suzuka", "suzuka_circuit"], "jp-1962", (34.8431, 136.5410, 2200), "Suzuka"),
    ("Fuji Speedway", ["fuji", "ks_fuji", "fuji_speedway"], "jp-1965", (35.3717, 138.9267, 1800), "Fuji Speedway"),
    ("Mount Panorama Circuit (Bathurst)", ["mount_panorama", "bathurst", "ks_mount_panorama", "mount_panorama_circuit"], None, (-33.4488, 149.5548, 2500), "Mount Panorama"),
    ("Circuit of the Americas", ["cota", "ks_cota", "circuit_of_the_americas"], "us-2012", (30.1328, -97.6411, 2000), "Circuit of the Americas"),
    ("Nurburgring GP-Strecke", ["nurburgring_gp", "nurburgring", "ks_nurburgring", "ks_nurburgring_gp"], "de-1927", (50.3356, 6.9475, 2000), "Nurburgring"),
    ("Nurburgring Nordschleife", ["nordschleife", "ks_nordschleife", "nurburgring_nordschleife"], None, (50.3580, 6.9640, 6500), "Nordschleife"),
    ("Red Bull Ring", ["red_bull_ring", "ks_red_bull_ring", "spielberg"], "at-1969", (47.2197, 14.7647, 1800), "Red Bull Ring"),
    ("Donington Park", ["donington_park", "donington", "ks_donington_park"], "gb-1931", (52.8306, -1.3753, 1500), "Donington Park"),
    ("Oulton Park", ["oulton_park", "ks_oulton_park"], None, (53.1794, -2.6129, 1600), "Oulton Park"),
    ("Circuit Paul Ricard", ["paul_ricard", "ks_paul_ricard", "circuit_paul_ricard"], "fr-1969", (43.2506, 5.7917, 2000), "Circuit Paul Ricard"),
    ("Road Atlanta", ["road_atlanta", "ks_road_atlanta", "michelin_raceway_road_atlanta"], None, (34.1458, -83.8177, 1800), "Road Atlanta"),
    ("Sebring International Raceway", ["sebring", "ks_sebring", "sebring_international_raceway"], "us-1950", (27.4547, -81.3483, 2200), "Sebring International Raceway"),
    ("Watkins Glen International", ["watkins_glen", "ks_watkins_glen", "watkins_glen_international"], "us-1956", (42.3369, -76.9272, 2000), "Watkins Glen"),
    ("Kyalami Grand Prix Circuit", ["kyalami", "ks_kyalami", "kyalami_grand_prix_circuit"], "za-1961", (-25.9989, 28.0689, 1800), "Kyalami"),
    ("Silverstone Circuit", ["silverstone", "ks_silverstone"], "gb-1948", (52.0786, -1.0169, 2200), "Silverstone"),
    ("Circuit de Barcelona-Catalunya", ["barcelona", "ks_barcelona", "catalunya"], "es-1991", (41.5700, 2.2611, 1800), "Barcelona-Catalunya"),
    ("Circuit Zandvoort", ["zandvoort", "ks_zandvoort"], "nl-1948", (52.3888, 4.5409, 1600), "Zandvoort"),
    ("Hungaroring", ["hungaroring", "ks_hungaroring"], "hu-1986", (47.5789, 19.2486, 1600), "Hungaroring"),
    ("Misano World Circuit Marco Simoncelli", ["misano", "ks_misano", "misano_world_circuit"], None, (43.9614, 12.6833, 1600), "Misano World Circuit"),
    ("Autodromo Internazionale del Mugello", ["mugello", "ks_mugello"], "it-1974", (43.9975, 11.3719, 1800), "Mugello"),
    ("Vallelunga", ["vallelunga", "ks_vallelunga", "autodromo_di_vallelunga"], None, (42.1578, 12.3686, 1500), "Vallelunga"),
]


def http_get_json(url, data=None, timeout=35):
    headers = {"User-Agent": "EvoResultsTrackGenerator/2.0"}
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_from_f1_github(f1_id):
    if not f1_id:
        return None
    url = f"{F1_CIRCUITS_BASE}{f1_id}.geojson"
    try:
        geo = http_get_json(url, timeout=15)
        features = geo.get("features", [])
        if not features:
            return None
        geom = features[0].get("geometry", {})
        coords = geom.get("coordinates", [])
        if geom.get("type") == "MultiLineString":
            coords = max(coords, key=len)
        return [(pt[0], pt[1]) for pt in coords if len(pt) >= 2]
    except Exception:
        return None


def stitch_segments(segments):
    if not segments:
        return []
    if len(segments) == 1:
        return segments[0]

    # Filtra segmenti troppo corti (pitlane/raccordi secondari) se ci sono segmenti principali
    segments = sorted(segments, key=len, reverse=True)
    chain = list(segments[0])
    remaining = [list(s) for s in segments[1:]]

    def dist(p1, p2):
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    # Collega in catena i segmenti contigui entro una soglia ragionevole (~350m in gradi ~0.0035)
    MAX_GAP = 0.0045
    changed = True
    while changed and remaining:
        changed = False
        best_idx = -1
        best_mode = None
        best_d = MAX_GAP

        for i, seg in enumerate(remaining):
            d_end_start = dist(chain[-1], seg[0])
            d_end_end = dist(chain[-1], seg[-1])
            d_start_end = dist(chain[0], seg[-1])
            d_start_start = dist(chain[0], seg[0])

            candidates = [
                (d_end_start, "append"),
                (d_end_end, "append_rev"),
                (d_start_end, "prepend"),
                (d_start_start, "prepend_rev"),
            ]
            for d, mode in candidates:
                if d < best_d:
                    best_d = d
                    best_idx = i
                    best_mode = mode

        if best_idx != -1:
            seg = remaining.pop(best_idx)
            if best_mode == "append":
                chain.extend(seg[1:])
            elif best_mode == "append_rev":
                chain.extend(list(reversed(seg))[1:])
            elif best_mode == "prepend":
                chain = seg[:-1] + chain
            elif best_mode == "prepend_rev":
                chain = list(reversed(seg))[:-1] + chain
            changed = True

    return chain


def fetch_from_overpass(coords_hint, query_name):
    if coords_hint:
        lat, lon, radius = coords_hint
        ql = f"""
        [out:json][timeout:30];
        (
          relation["route"="raceway"](around:{radius},{lat},{lon});
          way["highway"="raceway"](around:{radius},{lat},{lon});
        );
        out body;
        >;
        out skel qt;
        """
    else:
        safe_name = query_name.replace('"', '\"')
        ql = f"""
        [out:json][timeout:30];
        (
          relation["route"="raceway"]["name"~"{safe_name}",i];
          way["highway"="raceway"]["name"~"{safe_name}",i];
        );
        out body;
        >;
        out skel qt;
        """

    payload = urllib.parse.urlencode({"data": ql}).encode("utf-8")

    for mirror in OVERPASS_MIRRORS:
        for attempt in range(2):
            try:
                res = http_get_json(mirror, data=payload, timeout=35)
                elements = res.get("elements", [])
                if not elements:
                    break

                nodes = {}
                ways = {}
                relations = []

                for el in elements:
                    t = el.get("type")
                    if t == "node":
                        nodes[el["id"]] = (el["lon"], el["lat"])
                    elif t == "way":
                        ways[el["id"]] = el
                    elif t == "relation":
                        relations.append(el)

                # Preferisci una relazione chiusa (es. circuito principale) se disponibile
                target_way_ids = []
                if relations:
                    best_rel = max(relations, key=lambda r: len(r.get("members", [])))
                    for m in best_rel.get("members", []):
                        if m.get("type") == "way" and m.get("role", "") in ("", "forward", "backward"):
                            if m["ref"] in ways:
                                target_way_ids.append(m["ref"])

                if not target_way_ids:
                    for wid, w in ways.items():
                        tags = w.get("tags", {})
                        # Escludi pitlane o kartodromi se c'è la pista principale
                        if tags.get("service") in ("pit_lane", "parking_aisle"):
                            continue
                        target_way_ids.append(wid)

                segments = []
                for wid in target_way_ids:
                    w = ways.get(wid)
                    if not w:
                        continue
                    pts = [nodes[nid] for nid in w.get("nodes", []) if nid in nodes]
                    if len(pts) >= 2:
                        segments.append(pts)

                stitched = stitch_segments(segments)
                if len(stitched) >= 15:
                    return stitched
            except Exception as e:
                print(f"   [Mirror {mirror.split('/')[2]} tentativo {attempt+1}] {e}")
                time.sleep(2.5)
    return None


def render_track_png(points, out_paths):
    W, H = 640, 360
    PADDING = 44

    # Proiezione equirettangolare corretta per latitudine media
    avg_lat = sum(p[1] for p in points) / len(points)
    cos_lat = math.cos(math.radians(avg_lat))
    proj = [(p[0] * cos_lat, -p[1]) for p in points]

    min_x = min(p[0] for p in proj)
    max_x = max(p[0] for p in proj)
    min_y = min(p[1] for p in proj)
    max_y = max(p[1] for p in proj)

    span_x = max(max_x - min_x, 1e-6)
    span_y = max(max_y - min_y, 1e-6)

    scale = min((W - 2 * PADDING) / span_x, (H - 2 * PADDING) / span_y)
    offset_x = (W - span_x * scale) / 2.0
    offset_y = (H - span_y * scale) / 2.0

    canvas_pts = [
        ((p[0] - min_x) * scale + offset_x, (p[1] - min_y) * scale + offset_y)
        for p in proj
    ]

    # Sfondo scuro telemetrico trasparente/scuro
    img = Image.new("RGBA", (W, H), (14, 17, 24, 255))

    # Griglia telemetrica sottile
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grid)
    for gx in range(0, W, 32):
        gdraw.line([(gx, 0), (gx, H)], fill=(255, 255, 255, 8), width=1)
    for gy in range(0, H, 32):
        gdraw.line([(0, gy), (W, gy)], fill=(255, 255, 255, 8), width=1)
    img = Image.alpha_composite(img, grid)

    # Alone rosso esterno
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.line(canvas_pts, fill=(239, 68, 68, 120), width=14, joint="curve")
    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    img = Image.alpha_composite(img, glow)

    # Tracciato principale bianco/rosso ad alto contrasto
    track_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(track_layer)
    tdraw.line(canvas_pts, fill=(30, 35, 48, 255), width=11, joint="curve")
    tdraw.line(canvas_pts, fill=(241, 245, 249, 255), width=5, joint="curve")

    # Linea del traguardo (Start/Finish) perpendicolare al primo segmento
    if len(canvas_pts) >= 2:
        p0, p1 = canvas_pts[0], canvas_pts[1]
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        length = math.hypot(dx, dy)
        if length > 0:
            nx, ny = -dy / length, dx / length
            tdraw.line(
                [(p0[0] - nx * 11, p0[1] - ny * 11), (p0[0] + nx * 11, p0[1] + ny * 11)],
                fill=(239, 68, 68, 255),
                width=4
            )
            tdraw.ellipse(
                [p0[0] - 4, p0[1] - 4, p0[0] + 4, p0[1] + 4],
                fill=(16, 185, 129, 255)
            )

    img = Image.alpha_composite(img, track_layer)

    for alias in out_paths:
        out_file = os.path.join(OUTPUT_DIR, f"{alias}.png")
        img.save(out_file, "PNG")


def process_circuit(name, aliases, f1_id, coords_hint, osm_name, force=False):
    existing = [a for a in aliases if os.path.exists(os.path.join(OUTPUT_DIR, f"{a}.png"))]
    if not force and len(existing) == len(aliases):
        print(f"[SKIP] {name} (già presente)")
        return True

    print(f"[SCARICO] {name}...")
    pts = fetch_from_f1_github(f1_id)
    source = "GitHub F1-Circuits"

    if not pts:
        pts = fetch_from_overpass(coords_hint, osm_name)
        source = "OpenStreetMap"

    if pts and len(pts) >= 10:
        render_track_png(pts, aliases)
        print(f"   [OK] {name} ({len(pts)} punti da {source}) -> {', '.join(a + '.png' for a in aliases)}")
        return True
    else:
        print(f"   [FALLITO] Impossibile trovare coordinate GPS per: {name}")
        return False


def main():
    print("=== GENERAZIONE MAPPE CIRCUITI REALI PER EVO RESULTS ===")
    print(f"Cartella destinazione: {OUTPUT_DIR}\n")

    if len(sys.argv) >= 4 and sys.argv[1] == "--aggiungi":
        query_name = sys.argv[2]
        file_alias = sys.argv[3].lower().replace(".png", "").strip()
        aliases = list({file_alias, f"ks_{file_alias}"})
        process_circuit(query_name, aliases, None, None, query_name, force=True)
        return

    force = "--force" in sys.argv
    ok_count = 0
    for name, aliases, f1_id, coords_hint, osm_name in CIRCUITI_KUNOS:
        if process_circuit(name, aliases, f1_id, coords_hint, osm_name, force=force):
            ok_count += 1
        time.sleep(1.2)

    print(f"\nCompletato! {ok_count}/{len(CIRCUITI_KUNOS)} circuiti generati con successo.")


if __name__ == "__main__":
    main()
