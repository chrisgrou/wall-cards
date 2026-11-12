# Wall Cards

Custom κάρτες για wall-mounted tablet στο Home Assistant. Κοινό design language, ξεχωριστός χαρακτήρας ανά κάρτα, ρύθμιση από το UI χωρίς YAML.

Ένα αρχείο JavaScript, χωρίς build step και χωρίς εξαρτήσεις.

## Κάρτες

| Κάρτα | Τύπος | Τι κάνει |
|---|---|---|
| Wall · Φως | `custom:wall-light-card` | Ψηλή κάρτα. Σύρσιμο πάνω-κάτω για φωτεινότητα, διακόπτης στο κάτω μέρος. |
| Wall · Διακόπτης | `custom:wall-switch-card` | Μικρό πλήκτρο τοίχου για φως, πρίζα ή ό,τι ανάβει και σβήνει. |
| Wall · Κλειδαριά | `custom:wall-lock-card` | Μεταλλική πλάκα με πόμολο που γυρίζει. Προαιρετική ένδειξη μπαταρίας. |
| Wall · Είσοδος | `custom:wall-opener-card` | Θυροτηλέφωνο: χρυσό κουμπί για άνοιγμα, καμπανάκι για «άνοιγμα στο κουδούνι». |
| Wall · Πλυντήριο | `custom:wall-washer-card` | Τύμπανο που γυρίζει, υπόλοιπος χρόνος, πρόοδος προγράμματος, παύση/έναρξη. |
| Wall · Στεγνωτήριο | `custom:wall-dryer-card` | Όπως το πλυντήριο, με ζεστό τύμπανο. |
| Wall · Πλυντήριο πιάτων | `custom:wall-dishwasher-card` | Όπως το πλυντήριο, με βραχίονα ψεκασμού. |
| Wall · Κλίμα | `custom:wall-climate-card` | Θερμοστάτης, λέβητας ή κλιματιστικό. Ρύθμιση θερμοκρασίας, θερμότητα ή ψύχος στο φόντο. |
| Wall · Θερμοσίφωνας | `custom:wall-heater-card` | Διακόπτης με αντίστροφη μέτρηση (βλ. παρακάτω). |
| Wall · Καθαριστής αέρα | `custom:wall-purifier-card` | Φτερωτή που γυρίζει, μέτρηση PM2.5, χρώμα ανάλογα με την ποιότητα. |
| Wall · Ποιότητα αέρα | `custom:wall-air-card` | PM2.5 με CO₂, VOC και PM10. |
| Wall · Σκούπα | `custom:wall-vacuum-card` | Ρομπότ στη βάση του, έναρξη, παύση, επιστροφή. |
| Wall · Τηλεόραση | `custom:wall-tv-card` | Πλατιά. Τι παίζει τώρα, on/off, σίγαση. |
| Wall · Μουσική | `custom:wall-music-card` | Πλατιά. Εξώφυλλο, τίτλος, προηγούμενο / παύση / επόμενο. |
| Wall · Αυτοκίνητο | `custom:wall-car-card` | Πλατιά. Μπαταρία ή καύσιμο, αυτονομία, κλείδωμα, κλιματισμός, φόρτιση. |

Πάτημα στο σώμα μιας κάρτας (όχι σε κουμπί) ανοίγει το παράθυρο λεπτομερειών του Home Assistant.

### Θερμοσίφωνας με χρονόμετρο

Η κάρτα ανάβει τον διακόπτη και ξεκινά ένα **timer helper**. Το σβήσιμο όταν τελειώσει ο χρόνος το κάνει το Home Assistant, όχι η κάρτα, ώστε να δουλεύει και με το tablet κλειστό. Χρειάζεται ένα automation: «όταν τελειώσει το χρονόμετρο → σβήσε τον διακόπτη». Χωρίς `timer_entity` η κάρτα λειτουργεί ως απλός διακόπτης.

## Εγκατάσταση με HACS

1. HACS → μενού (⋮) → **Custom repositories**.
2. Βάλε τη διεύθυνση αυτού του αποθετηρίου και διάλεξε τύπο **Dashboard**.
3. Εγκατάστησε το **Wall Cards** και κάνε ανανέωση του browser.

## Χειροκίνητη εγκατάσταση

1. Αντίγραψε το `dist/wall-cards.js` στο `/config/www/wall-cards/dist/`.
2. Ρυθμίσεις → Dashboards → Resources → πρόσθεσε `/local/wall-cards/dist/wall-cards.js?v=0.2.0` ως **JavaScript module**.
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
