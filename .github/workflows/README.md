# GitHub Actions Workflows

## Pull Request Workflow (`pull-request.yml`)

Workflow uruchamiany automatycznie przy każdym Pull Request do brancha `master`.

### Struktura workflow

Workflow składa się z 4 jobów:

1. **Lint** - Lintowanie kodu
   - Uruchamia się jako pierwszy
   - Sprawdza jakość kodu za pomocą ESLint
   - Wykorzystuje composite action `setup-node-project` do konfiguracji środowiska

2. **Unit Tests** (równolegle z Build po zakończeniu Lint)
   - Uruchamia testy jednostkowe z coverage
   - Generuje raporty pokrycia kodu
   - Przechowuje raporty jako artifakty przez 30 dni
   - Wykorzystuje composite action `setup-node-project` do konfiguracji środowiska

3. **Build** (równolegle z Unit Tests po zakończeniu Lint)
   - Buduje projekt
   - Weryfikuje czy aplikacja poprawnie się kompiluje
   - Wykorzystuje composite action `setup-node-project` do konfiguracji środowiska

4. **Status Comment** (uruchamia się po zakończeniu wszystkich poprzednich jobów)
   - Tworzy komentarz w Pull Request ze statusem wszystkich jobów
   - Pokazuje które joby przeszły pomyślnie ✅ i które zawiodły ❌
   - Zawiera link do uruchomienia workflow
   - Uruchamia się tylko jeśli wszystkie poprzednie joby się zakończyły (niezależnie od wyniku)

### Wykorzystywane akcje

Wszystkie akcje są w najnowszych wersjach (stan na October 2025):

- `actions/checkout@v5` - Checkout kodu
- `actions/setup-node@v6` - Konfiguracja Node.js (wersja z `.nvmrc`)
- `actions/upload-artifact@v4` - Upload raportów coverage
- `actions/github-script@v8` - Tworzenie komentarzy w PR

### Composite Actions

#### `setup-node-project`

Wspólny action wykorzystywany przez wszystkie joby do konfiguracji środowiska:

- Instaluje Node.js w wersji zdefiniowanej w `.nvmrc` (22.14.0)
- Wykorzystuje cache npm dla szybszej instalacji
- Instaluje zależności za pomocą `npm ci`

### Coverage Reports

Raporty pokrycia kodu są generowane w formatach:
- **text** - wyświetlane w logach CI
- **json** - do dalszej analizy
- **html** - do przeglądania w przeglądarce

Raporty są przechowywane jako artifakty przez 30 dni i można je pobrać z zakładki Actions.

### Konfiguracja środowiska

- **Node.js version**: 22.14.0 (z `.nvmrc`)
- **Runner**: ubuntu-latest
- **Package manager**: npm (używa `npm ci` dla deterministycznej instalacji)

### Permissions

- Workflow ma uprawnienia do zapisu komentarzy w Pull Requests (`pull-requests: write`)
- Pozostałe uprawnienia są domyślne (odczyt kodu, artifakty)
- Pozostałe uprawnienia są domyślne (odczyt kodu, artifakty)

