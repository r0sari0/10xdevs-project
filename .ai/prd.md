# Dokument wymagań produktu (PRD) - AI Flashcard Generator

## 1. Przegląd produktu

Celem projektu jest stworzenie aplikacji internetowej, która usprawnia proces nauki poprzez automatyzację tworzenia fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji. Użytkownik może wkleić dowolny tekst, a aplikacja wygeneruje z niego zestaw fiszek, które następnie można przejrzeć, edytować i wykorzystać w nauce.

Wersja MVP (Minimum Viable Product) jest skierowana do osób uczących się języków obcych. Aplikacja ma na celu zminimalizowanie czasu potrzebnego na przygotowanie materiałów do nauki, pozwalając użytkownikom skupić się na samym procesie uczenia się.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje aplikacja, jest czasochłonność i pracochłonność manualnego tworzenia wysokiej jakości fiszek. Wielu uczniów i studentów rezygnuje z efektywnych metod nauki, takich jak spaced repetition, ponieważ bariera wejścia związana z przygotowaniem materiałów jest zbyt wysoka. Proces ręcznego wybierania kluczowych informacji, przepisywania ich i formatowania jest nużący i zniechęcający. Nasz produkt eliminuje ten problem, automatyzując tworzenie fiszek i czyniąc zaawansowane techniki nauki bardziej dostępnymi.

## 3. Wymagania funkcjonalne

### 3.1. Moduł użytkownika
-   Użytkownicy muszą mieć możliwość założenia konta za pomocą adresu e-mail i hasła.
-   System musi zapewniać funkcjonalność logowania i wylogowywania.
-   Musi istnieć mechanizm resetowania zapomnianego hasła.

### 3.2. Generowanie fiszek przez AI
-   Aplikacja musi udostępniać pole tekstowe (`textarea`), w które użytkownik może wkleić tekst do analizy.
-   Interfejs musi walidować długość wprowadzanego tekstu, akceptując od 1000 do 10000 znaków, i informować o tym użytkownika.
-   Przycisk inicjujący generowanie fiszek musi być dostępny po spełnieniu kryteriów walidacji.
-   Backend musi również weryfikować długość tekstu przed przetworzeniem.

### 3.3. Zarządzanie fiszkami
-   Użytkownik musi mieć dostęp do widoku listy wszystkich swoich zaakceptowanych fiszek.
-   Musi istnieć dedykowany interfejs do weryfikacji fiszek wygenerowanych przez AI, z opcjami "Akceptuj", "Edytuj" i "Odrzuć" (trwałe usunięcie) dla każdej fiszki.
-   Aplikacja musi udostępniać formularz do manualnego tworzenia fiszek, składający się z pola na przód (awers) i tył (rewers) fiszki.

### 3.4. Nauka
-   Aplikacja musi zawierać interfejs sesji nauki, który prezentuje fiszki zgodnie z logiką zintegrowanej, zewnętrznej biblioteki open-source do powtórek.
-   Podczas sesji użytkownik musi mieć możliwość oceny swojej znajomości danej fiszki, co wpłynie na harmonogram przyszłych powtórek.

## 4. Granice produktu

### 4.1. Funkcje objęte MVP
-   Generowanie fiszek przez AI na podstawie wklejonego tekstu.
-   Manualne tworzenie, edycja i usuwanie fiszek.
-   Prosty system kont użytkowników (e-mail/hasło) do przechowywania kolekcji fiszek.
-   Integracja z gotowym, zewnętrznym algorytmem powtórek.
-   Aplikacja będzie dostępna wyłącznie w wersji webowej.

### 4.2. Funkcje wykluczone z MVP
-   Rozwój własnego, zaawansowanego algorytmu powtórek (np. na wzór SuperMemo).
-   Importowanie treści z różnych formatów plików (PDF, DOCX itp.).
-   Funkcje społecznościowe, takie jak współdzielenie zestawów fiszek.
-   Integracje z innymi platformami edukacyjnymi.
-   Dedykowane aplikacje mobilne (iOS, Android).
-   Grupowanie fiszek w tematyczne talie/zestawy.

### 4.3. Zidentyfikowane ryzyka i nierozstrzygnięte kwestie
-   Nie wybrano jeszcze konkretnej biblioteki open-source do obsługi algorytmu spaced repetition.
-   Nie zdefiniowano precyzyjnej struktury zapytania (prompt) do AI ani oczekiwanego formatu odpowiedzi (np. schematu JSON).
-   Świadomie podjęto ryzyko produktowe, że brak grupowania fiszek w "talie" może negatywnie wpłynąć na użyteczność dla osób uczących się wielu zagadnień jednocześnie.

## 5. Historyjki użytkowników

### Moduł Uwierzytelniania

-   ID: US-001
-   Tytuł: Rejestracja nowego użytkownika
-   Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą e-maila i hasła, aby bezpiecznie przechowywać moje fiszki.
-   Kryteria akceptacji:
    -   Użytkownik może przejść do formularza rejestracji.
    -   Formularz wymaga podania poprawnego adresu e-mail i hasła.
    -   Hasło musi spełniać minimalne wymogi bezpieczeństwa (np. 8 znaków).
    -   System wyświetla błąd w przypadku podania nieprawidłowego formatu e-mail lub gdy e-mail jest już zajęty.
    -   Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany na główną stronę aplikacji.

-   ID: US-002
-   Tytuł: Logowanie użytkownika
-   Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się za pomocą e-maila i hasła, aby uzyskać dostęp do moich fiszek.
-   Kryteria akceptacji:
    -   Użytkownik może przejść do formularza logowania.
    -   Formularz wymaga podania e-maila i hasła.
    -   System wyświetla błąd w przypadku podania błędnych danych uwierzytelniających.
    -   Po pomyślnym zalogowaniu użytkownik jest przekierowany na główną stronę aplikacji.

-   ID: US-003
-   Tytuł: Resetowanie hasła
-   Opis: Jako użytkownik, który zapomniał hasła, chcę mieć możliwość jego zresetowania, aby odzyskać dostęp do konta.
-   Kryteria akceptacji:
    -   Na stronie logowania znajduje się link "Zapomniałem hasła".
    -   Po kliknięciu użytkownik może wprowadzić swój adres e-mail.
    -   Jeśli e-mail istnieje w bazie, system wysyła na niego wiadomość z linkiem do resetu hasła.
    -   Link prowadzi do strony, na której można ustawić nowe hasło.
    -   Użytkownik może zalogować się przy użyciu nowego hasła.

-   ID: US-004
-   Tytuł: Wylogowanie użytkownika
-   Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby zakończyć sesję i zabezpieczyć swoje konto.
-   Kryteria akceptacji:
    -   W interfejsie aplikacji widoczny jest przycisk "Wyloguj".
    -   Kliknięcie przycisku kończy sesję użytkownika.
    -   Użytkownik jest przekierowywany na stronę logowania.

### Główne Funkcjonalności

-   ID: US-005
-   Tytuł: Generowanie fiszek z tekstu
-   Opis: Jako osoba ucząca się języka, chcę wkleić artykuł w obcym języku i automatycznie otrzymać z niego listę fiszek ze słownictwem, aby zaoszczędzić czas na ich ręcznym tworzeniu.
-   Kryteria akceptacji:
    -   Na stronie głównej znajduje się pole tekstowe do wklejania treści.
    -   Interfejs na bieżąco wyświetla liczbę wprowadzonych znaków.
    -   Przycisk "Generuj fiszki" jest nieaktywny, jeśli tekst ma mniej niż 1000 lub więcej niż 10000 znaków.
    -   Wyświetlany jest komunikat o błędzie, jeśli użytkownik spróbuje wygenerować fiszki z tekstu o nieprawidłowej długości.
    -   Podczas generowania fiszek widoczny jest wskaźnik ładowania.
    -   Po zakończeniu procesu użytkownik jest przenoszony do interfejsu weryfikacji fiszek.

-   ID: US-006
-   Tytuł: Weryfikacja wygenerowanych fiszek
-   Opis: Jako użytkownik, chcę przejrzeć listę fiszek od AI, poprawić te, które tego wymagają, i odrzucić błędne, aby mój materiał do nauki był wysokiej jakości.
-   Kryteria akceptacji:
    -   Interfejs prezentuje fiszki wygenerowane przez AI pojedynczo.
    -   Dla każdej fiszki dostępne są opcje: "Akceptuj", "Edytuj", "Odrzuć".
    -   "Akceptuj" dodaje fiszkę do głównej kolekcji użytkownika i wyświetla kolejną.
    -   "Edytuj" otwiera formularz z treścią fiszki, umożliwiając jej modyfikację przed zaakceptowaniem.
    -   "Odrzuć" trwale usuwa fiszkę z systemu i wyświetla kolejną.
    -   Po weryfikacji wszystkich fiszek użytkownik jest przekierowywany do widoku swojej kolekcji.

-   ID: US-007
-   Tytuł: Ręczne tworzenie fiszki
-   Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowej fiszki, wpisując jej przód i tył.
-   Kryteria akceptacji:
    -   W interfejsie dostępny jest przycisk "Dodaj nową fiszkę".
    -   Otwiera on formularz z polami "Awers" i "Rewers".
    -   Oba pola są wymagane do zapisu.
    -   Zapisana fiszka pojawia się na liście wszystkich fiszek użytkownika.

-   ID: US-008
-   Tytuł: Przeglądanie kolekcji fiszek
-   Opis: Jako użytkownik, chcę widzieć listę wszystkich moich fiszek, aby zarządzać swoim materiałem do nauki.
-   Kryteria akceptacji:
    -   Aplikacja wyświetla listę wszystkich zaakceptowanych fiszek.
    -   Każdy element na liście pokazuje treść awersu i rewersu.
    -   Przy każdej fiszce dostępne są opcje edycji i usunięcia.

-   ID: US-009
-   Tytuł: Edycja istniejącej fiszki
-   Opis: Jako użytkownik, chcę mieć możliwość edytowania moich istniejących fiszek, aby poprawić błędy lub uzupełnić informacje.
-   Kryteria akceptacji:
    -   Kliknięcie opcji "Edytuj" przy fiszce otwiera formularz edycji.
    -   Formularz jest wypełniony aktualną treścią fiszki.
    -   Po zapisaniu zmian zaktualizowana treść jest widoczna na liście.

-   ID: US-010
-   Tytuł: Usuwanie fiszki
-   Opis: Jako użytkownik, chcę móc trwale usunąć fiszkę, której już nie potrzebuję.
-   Kryteria akceptacji:
    -   Kliknięcie opcji "Usuń" przy fiszce wyświetla prośbę o potwierdzenie.
    -   Po potwierdzeniu fiszka jest trwale usuwana z kolekcji użytkownika.

-   ID: US-011
-   Tytuł: Sesja nauki
-   Opis: Jako użytkownik, chcę mieć możliwość rozpoczęcia sesji nauki, podczas której aplikacja będzie mi pokazywać fiszki do powtórki w optymalnych odstępach czasu.
-   Kryteria akceptacji:
    -   W interfejsie dostępny jest przycisk "Rozpocznij naukę".
    -   Sesja nauki prezentuje jedną fiszkę naraz, pokazując najpierw jej awers.
    -   Użytkownik może odsłonić rewers.
    -   Użytkownik ocenia, jak dobrze zna odpowiedź (np. "Łatwe", "Trudne", "Do powtórki").
    -   Sesja kończy się, gdy nie ma więcej fiszek zaplanowanych do powtórki na dany dzień.

## 6. Metryki sukcesu

Kluczowe wskaźniki (KPIs), które pozwolą ocenić sukces produktu w wersji MVP, są następujące:

-   Kryterium 1: Wskaźnik akceptacji fiszek generowanych przez AI.
    -   Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkowników.
    -   Sposób pomiaru: System będzie zliczał liczbę zaakceptowanych i odrzuconych fiszek w każdej sesji generowania. Metryka będzie obliczana jako `(liczba zaakceptowanych fiszek) / (liczba zaakceptowanych fiszek + liczba odrzuconych fiszek)`.

-   Kryterium 2: Udział fiszek generowanych przez AI w całkowitej liczbie fiszek.
    -   Cel: 75% wszystkich fiszek w systemie jest tworzonych przy użyciu generatora AI.
    -   Sposób pomiaru: Każda fiszka w bazie danych będzie miała atrybut wskazujący jej pochodzenie ("AI" lub "manualna"). Metryka będzie obliczana jako `(łączna liczba fiszek AI) / (łączna liczba wszystkich fiszek w systemie)`.
