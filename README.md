# ★ GALAXY ★ (8-Bit Nintendo NES Edition)

Wierna rekonstrukcja kultowego kosmicznego shootera w stylu 8-bitowego Nintendo (Famicom / NES) oraz klasyków z automatów arcade (Galaxian / Galaga).

---

## 🎮 Sterowanie

- **W** — Ruch w górę
- **A** — Ruch w lewo
- **S** — Ruch w dół
- **D** — Ruch w prawo
- **SPACJA** — Wystrzał laserów / Rozpoczęcie gry ze strony tytułowej

Alternatywnie obsługiwane są również klawisze strzałek.

---

## 🚀 Jak uruchomić grę?

Możesz uruchomić grę w dowolnej przeglądarce (Safari, Chrome, Firefox, Edge).

### Sposób 1: Szybki lokalny serwer HTTP (Zalecany do audio w nowoczesnych przeglądarkach)
Otwórz terminal w katalogu projektu i wykonaj:
```bash
python3 -m http.server 8080
```
Następnie otwórz w przeglądarce: [http://localhost:8080](http://localhost:8080)

LUB jeśli wolisz npm:
```bash
npm start
```

### Sposób 2: Bezpośrednie otwarcie pliku
Możesz po prostu dwukrotnie kliknąć plik `index.html` w Finderze lub przeciągnąć go do okna przeglądarki.

---

## 🎨 Wizualia i Styl 8-Bit Nintendo

- **Oryginalna paleta NES (54 barwy)**: Klasyczne nasycone odcienie czerwieni, żółci, zieleni i błękitów.
- **Ręcznie odwzorowane macierze pikselowe (16x16 & 8x8)**:
  - Statek gracza (ze zmienną animacją płomienia silnika)
  - Pszczoła / Drone (skrzydła otwarte/zamknięte)
  - Motyl / Hornet (agresywne ataki z pikowania)
  - Flagship / Boss Galaga (2 poziomy wytrzymałości: zielony i uszkodzony niebieski)
  - 5-fazowa animacja eksplozji pikselowej
- **Autentyczny filtr kineskopowy CRT**:
  - Paski luminoforu i linie skanowania (scanlines)
  - Subtelna winieta i poświata ekranu z możliwością włączenia/wyłączenia jednym przyciskiem.
- **Wielowarstwowe tło gwiezdne**:
  - Paralaksa 3 prędkości gwiazd
  - Migotanie kolorów gwiazd jak na NES.

---

## 🔊 Syntezator Audio NES 2A03 APU (Web Audio API)

Dźwięk jest generowany w czasie rzeczywistym bezpośrednio przez Web Audio API (zero zewnętrznych plików mp3/wav, 0 opóźnień):
- **Kanały Pulse 1 & Pulse 2 (Square wave ze zmiennym wypełnieniem 25% / 50%)**:
  - Dźwięk strzału gracza (szybki zjazd częstotliwości)
  - Dźwięk pikowania obcych (falująca oscylacja retro)
  - Chiptune jingle na start poziomu oraz zwycięski fanfare
- **Kanał Triangle (fala trójkątna)**:
  - Głęboki, miękki bas retro pod melodie startowe i uderzenia
- **Kanał Noise (15-bitowy LFSR)**:
  - Symulacja układu szumowego konsoli NES z pseudo-losowym rejestrem przesuwającym, dająca chrupki, soczysty dźwięk wybuchu statków kosmicznych!

---

## 👾 Mechanika Rozgrywki

1. **Wlot eskadr**: Wrogowie wlatują po krzywych Béziera na swoje pozycje w szyku.
2. **Falujący szyk bojowy**: Formacja obcych kołysze się na boki.
3. **Pikujące ataki kamikadze**: Co kilka sekund pojedynczy wrogowie lub bossowie w asyście eskorty odłączają się z szyku, pikują po łukach w dół i ostrzeliwują gracza.
4. **Punktacja**:
   - Pszczoła: 50 pkt (w szyku) / 100 pkt (w locie pikującym)
   - Motyl: 80 pkt (w szyku) / 160 pkt (w locie pikującym)
   - Boss: 150 pkt (w szyku) / 400 pkt (w locie pikującym)
5. **Progresja fal (Stages)**: Kolejne etapy zwiększają agresję, prędkość pikowania i częstotliwość strzałów wroga.

---

## ⚡ Zrzuty Uzbrojenia i Ulepszenia (Power-ups)

Zestrzelenie nurkujących wrogów daje szansę na upuszczenie kapsuły ze specjalną bronią:
- **[R] Rapid Fire**: Podwójna prędkość i potrójny magazynek pocisków.
- **[M] Missiles**: Samonaprowadzające się rakiety namierzające najbliższych wrogów z efektem dymu.
- **[H] Hyper Rockets**: Ciężkie rakiety niszczące całe kolumny wrogów z podwójną siłą.
- **[S] Force Field**: Obracająca się tarcza energetyczna chroniąca statek przed trafieniami pocisków i bezpośrednim taranowaniem.

---

## 🕹️ COMMODORE 64 EDITION (VIC-II + SID 6581)

Wersja dedykowana na komputer Commodore 64 dostępna jest w przeglądarce oraz jako natywny obraz dla prawdziwego C64 i emulatorów:

- **Wersja przeglądarkowa**: [http://localhost:8080/c64.html](http://localhost:8080/c64.html) lub kliknij `c64.html`
- **Wersja natywna MOS 6510**:
  - Plik wykonywalny: [`galaxy.prg`](file:///Users/wojciechnowacki/Desktop/Devel/galaxy/galaxy.prg)
  - Obraz dyskietki 1541: [`galaxy.d64`](file:///Users/wojciechnowacki/Desktop/Devel/galaxy/galaxy.d64)

### Uruchamianie w emulatorze VICE:
```bash
# Uruchomienie bezpośrednio pliku PRG
x64sc galaxy.prg

# Lub zamontowanie dyskietki D64
x64sc galaxy.d64
```

### Architektura wersji C64:
- **8 Sprzętowych Duszków VIC-II (MOB 0–7)**: Myśliwiec gracza, pole siłowe, lasery plazmowe, nurkujący bossowie/owady, bomby i eksplozje są w 100% renderowane sprzętowo w krzemie VIC-II ($D000–$D02E), zapewniając zero narzutu CPU i idealną płynność.
- **Sprzętowy rejestr kolizji `$D01E`**: Detekcja kolizji duszek-duszek realizowana z subpikselową precyzją w krzemie.
- **Własny zestaw znaków w RAM ($6800)**: Formacja obcych w Banku 1 ($4000–$7FFF) z dedykowaną pamięcią ekranu ($6000).
- **Dźwięk SID 6581/8580**: Rezonansowy filtr dolnoprzepustowy, szum 12-bit LFSR (eksplozje), fala piłokształtna i trójkątna, słynne arpeggia w stylu Roba Hubbarda przy zbieraniu bonusów.
- **Taktowanie PAL 50Hz i 8-cyklowy Galois LFSR**: Prawdziwa synchronizacja powrotu plamki kineskopu (VBLANK) i ultra-szybki generator liczb losowych gwarantujący stałe 50 FPS.
- **Sterowanie**: Klawiatura (WASD + Spacja) oraz port dżojstika 2 ($DC00).

---

### 📖 How-To Guide: Jak powstała wersja na Commodore 64 (Przewodnik po kodzie)

Niniejszy przewodnik wyjaśnia krok po kroku, jak gra została przeniesiona z wysokopoziomowego kodu JavaScript/Canvas na architekturę sprzętową komputera **Commodore 64** (procesor **MOS 6510**, układ graficzny **VIC-II** i układ dźwiękowy **SID 6581/8580**), w jaki sposób rozwiązano wąskie gardła wydajnościowe oraz gdzie w pliku [`c64/main.c`](c64/main.c) znajdują się poszczególne mechanizmy.

#### 1. Geneza powstania i optymalizacja (Od 5 FPS do 50 FPS)

Początkowa, naiwna implementacja na C64 cierpiała na drastyczny spadek płynności do około **5 klatek na sekundę**. Analiza kodu wykazała dwie główne przyczyny:
1. **Rysowanie po matrycy znakowej w pętli C**: Próba czyszczenia i rysowania obiektów ruchomych na ekranie tekstowym (`$6000`) i matrycy kolorów (`$D800`) za pomocą funkcji programowych kosztowała setki cykli CPU na obiekt w każdej klatce.
2. **Koszt standardowej biblioteki `rand()`**: Funkcja `rand()` z biblioteki cc65 wykonuje 32-bitowe dzielenie programowe, zużywając **~1 200 cykli zegara**. Przy obsłudze gwiazd i AI obcych, sam generator losowy pochłaniał ponad 25 000 cykli, przekraczając **cały budżet klatki PAL C64 (19 656 cykli zegara przy 0.985 MHz)**.

**Rozwiązanie**: Przepisano grę tak, by dynamiczne obiekty obsługiwał wyłącznie sprzętowy silnik **8 duszków VIC-II (Hardware Sprites / MOBs)**, wprowadzono 8-cyklowy generator liczb pseudolosowych **Galois LFSR**, a detekcję kolizji powierzono krzemowemu rejestrowi **`$D01E`**. Dzięki temu narzut pętli gry spadł do zaledwie ~3 000 cykli na klatkę, osiągając stałe, zablokowane **50 FPS**.

#### 2. Mapa Pamięci i konfiguracja Banku 1 VIC-II (`$4000–$7FFF`)

W Commodore 64 układ VIC-II widzi w danym momencie tylko 16 KB pamięci (jeden z 4 banków). Domyślny Bank 0 (`$0000–$3FFF`) koliduje z kodem programu generowanym przez kompilator cc65 (`$0801–$2400`), stosem i stroną zerową. Dlatego gra przełącza VIC-II na **Bank 1 (`$4000–$7FFF`)**:

```
+-------------------------------------------------------------+
|               MAPA PAMIĘCI BANKU 1 VIC-II                   |
+-------------------+-----------------------------------------+
| Adres w pamięci   | Przeznaczenie                           |
+-------------------+-----------------------------------------+
| $0801 - $2FFF     | Kod maszynowy gry (program kompilatora) |
| $4000 - $5FFF     | Wolna pamięć / bufory                   |
| $6000 - $63E7     | Pamięć ekranu tekstu (Screen RAM 40x25) |
| $63F8 - $63FF     | Wskaźniki danych 8 duszków (Pointers)   |
| $6800 - $6FFF     | Generator znaków w RAM (Custom Charset) |
| $7000 - $71FF     | Bitmapy 8 sprzętowych duszków (MOB 0-7) |
| $D800 - $DBE7     | Matryca kolorów (Color RAM - I/O Area)  |
+-------------------+-----------------------------------------+
```

Przełączenie banku odbywa się w liniach 276–282 pliku `c64/main.c`:
- Port linii CIA 2 (`$DD00`, bity 0–1) ustawia Bank 1: `POKE(0xDD00, (PEEK(0xDD00) & ~3) | 2);`
- Rejestr VIC-II `$D018` ustawia ekran na `$6000` i znaki na `$6800`: `POKE(0xD018, 0x8A);`

#### 3. Anatomia i lokalizacja modułów w kodzie (`c64/main.c`)

| Moduł / Mechanizm | Zakres linii w `c64/main.c` | Opis techniczny i zastosowane rejestry |
|---|---|---|
| **Definicje Rejestrów i Adresów** | `12 – 144` | Stałe pamięci Banku 1, rejestry VIC-II (`$D000–$D02E`), rejestry SID (`$D400–$D418`), porty CIA oraz tablice szybkiego adresowania wierszy `screen_rows[]` i `color_rows[]`. |
| **Generator LFSR (Fast RNG)** | `138 – 144` | 8-bitowy generator Galois LFSR (`fast_rnd()`). Wykonuje się w zaledwie 8 cykli maszynowych zamiast 1200 cykli `rand()`. |
| **Dane Klocków Duszków (Sprites)** | `145 – 218` | 8 tablic po 64 bajty (24x21 px monokolor): myśliwiec (`sp_player`), tarcza (`sp_shield`), pociski (`sp_laser`), boss (`sp_boss`), owad (`sp_bee`), bomba (`sp_ebomb`), wybuch (`sp_exp`). |
| **Własny Generator Znaków (Charset)** | `219 – 241` | Tablica `custom_tiles[10][8]` zawierająca kafelki 8x8 dla lewej i prawej połówki pszczoły (`CH_BEE_L/R`), motyla (`CH_BFLY_L/R`), bossa (`CH_BOSS_L/R`), gwiazd i kapsuł bonusowych. |
| **Inicjalizacja Sprzętu (`init_c64_hardware`)** | `247 – 310` | Kopiowanie fontu ROM do RAM `$6800` (z wyłączeniem przerwań `SEI`/`CLI`), podmiana znaków 64..73 na kafelki obcych, kopiowanie duszków pod `$7000`, konfiguracja wskaźników `$63F8–$63FF` i kolorów duszków. |
| **Syntezator Audio SID (`sid_*`)** | `312 – 352` | Bezpośrednia konfiguracja oscylatorów SID: `sid_laser` (Sawtooth + szybki decay), `sid_explode` (generator szumu Noise na głosie 3), `sid_powerup` (arpeggio Triangle), `sid_shield` (Pulse wave). |
| **Rysowanie HUD i Tekstu** | `355 – 579` | Szybkie procedury `printText()` i `draw_hud()` wypisujące wynik `1UP`, `HIGH`, liczbę żyć `L` oraz aktywną broń `WPN` bezpośrednio do `screen_rows` i `color_rows`. |
| **Formacja Obcych i Kołysanie** | `467 – 536` | Inicjalizacja 24 obcych w formacji. Funkcje `draw_formation()` i `clear_formation()` odświeżają ekran znakowy **tylko raz na 12 klatek**, co uwalnia procesor podczas pozostałych klatek. |
| **Sprzętowa Synchronizacja Duszków (`sync_hardware_sprites`)** | `584 – 654` | Przepisuje aktualne pozycje obiektów do rejestrów VIC-II `$D000–$D00F`, ustawia 9. bit pozycji X w rejestrze `$D010` (MSB) oraz włącza aktywne duszki w rejestrze `$D015`. |
| **Strzelanie i Ataki Wrogów** | `657 – 724` | Procedura `shoot_laser()` (obsługa lasera pojedynczego i podwójnego), `trigger_dive()` (odłączenie wroga z szyku do lotu nurkującego jako duszek sprzętowy) oraz `trigger_explosion()`. |
| **Ekran Tytułowy (`title_screen`)** | `726 – 773` | Prezentacja punktacji, animowanego duszka myśliwca gracza, tabeli przeciwników i instrukcji sterowania. Czeka na Spację lub przycisk Fire na dżojstiku. |
| **Pętla Główna Gry (`main`)** | `778 – 1059` | Główna pętla wykonująca się w 50 Hz. |
| **Obsługa Sterowania (WASD + Joystick)** | `813 – 849` | Podwójny odczyt: rejestr CIA 1 (`$DC00`) dla dżojstika w porcie 2 oraz komórka `$00C5` (bieżący kod klawisza) dla natychmiastowej reakcji na klawisze WASD i Spację. |
| **Sprzętowe Kolizje `$D01E`** | `924 – 985` | Odczyt rejestru `VIC_SP_SP_COL` (`$D01E`): detekcja w krzemie trafienia lasera gracza w pikującego bossa (bit 4) lub pszczołę (bit 5), oraz kolizji wroga/pocisku z myśliwcem gracza (bit 0). |
| **Synchronizacja Rastrowa PAL 50Hz (VBLANK)** | `1031 – 1035` | Oczekiwanie na powrót plamki pionowej kineskopu z poprawnym testowaniem bitu 7 rejestru `$D011` (9-bitowy licznik linii rastra): gwarantuje idealnie płynne 50 klatek na sekundę bez tearingu. |

#### 4. Jak skompilować kod i przygotować obraz dyskietki

Kod jest w pełni zintegrowany z cross-kompilatorem **cc65** oraz narzędziami emulatora **VICE**:

1. **Kompilacja do pliku wykonywalnego C64 (`galaxy.prg`)**:
   ```bash
   cl65 -t c64 -O -o galaxy.prg c64/main.c
   ```
   *Flaga `-t c64` ustawia target na architekturę Commodore 64, a flaga `-O` uruchamia optymalizator kodu maszynowego 6502.*

2. **Przygotowanie bootowalnego obrazu dyskietki 1541 (`galaxy.d64`)**:
   ```bash
   c1541 -format "galaxy,01" d64 galaxy.d64 -write galaxy.prg galaxy
   ```

3. **Uruchomienie w emulatorze VICE (`x64sc`)**:
   ```bash
   x64sc galaxy.prg
   ```

