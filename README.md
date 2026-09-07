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
