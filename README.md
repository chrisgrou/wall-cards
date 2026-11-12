# Wall Cards

Custom κάρτες για wall-mounted tablet στο Home Assistant. Κοινό design language, ξεχωριστός χαρακτήρας ανά κάρτα, ρύθμιση από το UI χωρίς YAML.

Ένα αρχείο JavaScript, χωρίς build step και χωρίς εξαρτήσεις.

## Κάρτες

| Κάρτα | Τύπος | Τι κάνει |
|---|---|---|
| Wall · Φως | `custom:wall-light-card` | Ψηλή κάρτα. Σύρσιμο πάνω-κάτω για φωτεινότητα, διακόπτης στο κάτω μέρος. |
| Wall · Κλειδαριά | `custom:wall-lock-card` | Μεταλλική πλάκα με πόμολο που γυρίζει. Προαιρετική ένδειξη μπαταρίας. |
| Wall · Πλυντήριο | `custom:wall-washer-card` | Τύμπανο που γυρίζει, υπόλοιπος χρόνος, πρόοδος προγράμματος, παύση/έναρξη. |

## Εγκατάσταση με HACS

1. HACS → μενού (⋮) → **Custom repositories**.
2. Βάλε τη διεύθυνση αυτού του αποθετηρίου και διάλεξε τύπο **Dashboard**.
3. Εγκατάστησε το **Wall Cards** και κάνε ανανέωση του browser.

## Χειροκίνητη εγκατάσταση

1. Αντίγραψε το `dist/wall-cards.js` στο `/config/www/wall-cards/dist/`.
2. Ρυθμίσεις → Dashboards → Resources → πρόσθεσε `/local/wall-cards/dist/wall-cards.js?v=0.1.0` ως **JavaScript module**.
3. Σε κάθε αλλαγή του αρχείου άλλαξε το `?v=`, αλλιώς ο browser κρατά την παλιά έκδοση.

## Χρήση

Σε ένα dashboard: **Προσθήκη κάρτας** → αναζήτηση «Wall» → διάλεξε κάρτα και entity από τη φόρμα.

Παράδειγμα σε YAML:

```yaml
type: custom:wall-washer-card
entity: input_select.washer_state        # τρέχει / σβηστό / τελείωσε
remaining_entity: sensor.washer_remaining_time
total_entity: sensor.washer_initial_time
program_entity: sensor.washer_current_course
temp_entity: sensor.washer_water_temp
pause_entity: button.washer_pause
start_entity: button.washer_remote_start
```

Όλα τα πεδία εκτός από το `entity` είναι προαιρετικά. Ό,τι λείπει απλώς δεν εμφανίζεται.

## Ανάπτυξη

Το `dev/index.html` δείχνει όλες τις κάρτες με ψεύτικα entities, χωρίς σύνδεση στο Home Assistant:
`http://<HA>/local/wall-cards/dev/index.html`

### Προσθήκη νέας κάρτας

Όλος ο κώδικας είναι στο `dist/wall-cards.js`:

1. Γράψε μια κλάση που κληρονομεί το `WallBaseCard` και ορίζει:
   - `static css` — η εμφάνιση της κάρτας
   - `template()` — το HTML
   - `watched()` — ποια entities παρακολουθεί
   - `update()` — τι αλλάζει όταν αλλάξει η κατάσταση
   - `static getConfigForm()` — τα πεδία της φόρμας ρυθμίσεων
2. Πρόσθεσε μία γραμμή `register(...)` στο τέλος του αρχείου.
3. Πρόσθεσέ την στο `dev/index.html` για δοκιμή.

Χρώματα, γραμματοσειρές και κοινά στοιχεία (τίτλος, υπότιτλος, πλαίσιο κάρτας) ορίζονται μία φορά στο `BASE_CSS`.

## Για AI agents

Οι κανόνες για όποιον (άνθρωπο ή AI agent) προσθέτει ή αλλάζει κάρτες βρίσκονται στο [AGENTS.md](AGENTS.md): αρχιτεκτονική, design language, συμβόλαιο της βασικής κλάσης, έλεγχοι πριν την παράδοση και οι κάρτες που απομένουν.
