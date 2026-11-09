/* =====================================================================
   Begleitung, Teil 1: alle Texte.
   Bereiche in einem Satz, Erklärungen für den Hilfe-Modus, Begriffe,
   Rundgang und die kleinen Anleitungen je Seite.
   Sprache: kurze Sätze, Küchenwörter, „Sie“.
   ===================================================================== */

/* ---------- Bereiche: ein Satz, wozu ---------- */
const NAV_DESC = {
  aufbau:'Kleine Aufgaben, die Sie Schritt für Schritt durch die App führen.',
  dash:'Was heute zu bestellen ist und welche Lieferung kommt.',
  menu:'Alle Gerichte mit Preis. Hier machen Sie auch die Karte für die Gäste.',
  cards:'Was in ein Gericht kommt und was es kostet.',
  labor:'Zutaten eintippen, die App schlägt Gerichte daraus vor.',
  stock:'Was im Haus ist. Lieferung einbuchen, Schwund buchen, zählen.',
  buy:'Beim Lieferanten bestellen und Lieferungen prüfen.',
  products:'Jede Zutat mit ihrem Einkaufspreis.',
  report:'Was verkauft wurde und was es gebracht hat.',
  setup:'Name, Steuer, Team, Sicherung und Hilfe.',
  pcheck:'Einkaufspreise eintragen, einen nach dem anderen.',
  begriffe:'Alle Fachwörter der App, kurz erklärt.',
  stempel:'Ihre gesammelten Stempel.',
};
const NAV_GROUP_NAMES = {'Start':'Start', 'Küche':'Karte & Rezepte', 'Bestand':'Ware & Einkauf', 'Zahlen':'Verkauf'};

/* ---------- Erklärungen ----------
   HELP[key] = {t: Titel, x: Text, g: 1 = steht auch unter „Begriffe“} */
const HELP = {};
function H(k, t, x, g){ HELP[k] = {k, t, x, g: g ? 1 : 0}; }

/* Begriffe */
H('wareneinsatz','Wareneinsatz','Was die Zutaten für eine Portion kosten. Nur die Ware: ohne Lohn, Miete und Strom.',1);
H('we_pct','WE % · Wareneinsatz in Prozent','Wie viel vom Verkaufspreis für die Zutaten draufgeht. Beispiel: Zutaten 3 €, Preis ohne Steuer 10 €. Das sind 30 %. Je niedriger, desto mehr bleibt Ihnen.',1);
H('ziel_we','Ziel-Wareneinsatz','Ihre eigene Grenze für WE %. Liegt ein Gericht darüber, ist es zu teuer in der Herstellung oder zu billig auf der Karte. Sie stellen die Zahl in den Einstellungen ein.',1);
H('rohertrag','Rohertrag','Was vom Preis übrig bleibt, wenn die Zutaten bezahlt sind. Davon zahlen Sie Lohn, Miete und Strom.',1);
H('aufschlag','Aufschlagsfaktor','Preis ohne Steuer geteilt durch Wareneinsatz. Faktor 4 heißt: Das Gericht bringt viermal so viel, wie die Zutaten kosten.',1);
H('richtwert','Richtwert','Ein Beispielpreis aus den Demodaten. Er gilt nur, bis Sie Ihren echten Einkaufspreis eintragen oder bestätigen.',1);
H('putzverlust','Putzverlust','Was beim Putzen wegfällt: Schale, Strunk, Knochen. 20 % heißt: Von 1 kg bleiben 800 g.',1);
H('garverlust','Garverlust','Was beim Garen verloren geht, weil Wasser und Fett austreten. Ein Schnitzel wiegt nach der Pfanne weniger als davor.',1);
H('brutto_netto_g','Brutto, netto, fertig','Brutto ist die Ware, wie sie geliefert wird. Netto ist sie geputzt. Fertig ist sie gegart am Teller.',1);
H('mindestbestand','Mindestbestand','So viel soll immer im Haus sein. Liegt der Bestand darunter, schlägt die App eine Bestellung vor.',1);
H('annahmeschluss','Annahmeschluss','Bis zu dieser Uhrzeit nimmt der Lieferant Bestellungen an. Wer später bestellt, bekommt die Ware erst am nächsten Liefertag.',1);
H('gebinde','Gebinde','Die Packung, in der der Lieferant verkauft: Kiste, Sack, Karton. Beispiel: 1 Sack Mehl = 25 kg.',1);
H('bestelltag','Bestelltag und Liefertag','Am Bestelltag nimmt der Lieferant Bestellungen an. Am Liefertag bringt er die Ware. Beides steht beim Lieferanten.',1);
H('mindestbestellwert','Mindestbestellwert','Unter diesem Betrag liefert der Lieferant nicht oder verlangt einen Zuschlag.',1);
H('bestellvorschlag','Bestellvorschlag','Die App rechnet aus, was unter dem Mindestbestand liegt, und schlägt die Menge vor. Sie können jede Zahl ändern.',1);
H('entwurf','Entwurf','Eine Bestellung, die noch nicht beim Lieferanten ist. Sie können sie ändern oder löschen.',1);
H('freigabe','Freigabe','Bestellungen über einem bestimmten Betrag muss der Inhaber erst erlauben. Den Betrag stellen Sie in den Einstellungen ein.',1);
H('rezeptur','Rezeptur','Hier steht, was in ein Gericht kommt und was es kostet: Zutaten, Mengen, Zubereitung.',1);
H('basisrezept','Basisrezept','Etwas, das Sie vorkochen und in mehreren Gerichten brauchen: Fond, Teig, Dressing. Einmal anlegen, überall verwenden.',1);
H('charge','Charge','Die Menge, die Sie auf einmal herstellen. Beispiel: ein Topf Gulaschansatz mit 5 kg.',1);
H('ausbeute','Ausbeute','Wie viel Gramm am Ende herauskommen. Bei einem Gericht ist das die Portion, bei einem Basisrezept der ganze Topf.',1);
H('teller','Teller','Das Bild einer Rezeptur. Jedes Stück ist eine Zutat. Je größer das Stück, desto mehr kostet diese Zutat.',1);
H('kostenstruktur','Kostenstruktur','Welche Zutat wie viel vom Wareneinsatz ausmacht. Die teuerste steht oben. Dort lohnt sich das Sparen.',1);
H('preissim','Preis-Simulator','Ein Regler zum Ausprobieren: Was bleibt übrig, wenn das Gericht mehr oder weniger kostet? Erst „Übernehmen“ ändert den Preis.',1);
H('produktionsmenge','Produktionsmenge','Wie viel Ware Sie für eine bestimmte Zahl von Portionen brauchen. Praktisch fürs Vorbereiten.',1);
H('allergene','Allergene','Die 14 Stoffe, die auf der Karte stehen müssen, mit Buchstaben von A bis R. Die App liest sie aus den Zutaten der Rezeptur.',1);
H('saison','Saison','Winter, Frühling, Sommer, Herbst. Ein Gericht kann nur in bestimmten Saisonen auf der Karte stehen.',1);
H('aktion','Aktion','Eine Karte für kurze Zeit: Wildwochen, Silvester, Ostern. Sie gilt nur an den Tagen, die Sie festlegen.',1);
H('kategorie','Kategorie','Eine Überschrift auf der Speisekarte: Suppen, Hauptspeisen, Desserts.',1);
H('gaestekarte','Gästekarte','Die Speisekarte, wie die Gäste sie sehen. Ohne Wareneinsatz, mit Allergenen.',1);
H('lagerwert','Lagerwert','Was die Ware im Haus wert ist: Bestand mal Einkaufspreis.',1);
H('lagerort','Lagerort','Wo die Ware liegt: Kühlhaus, Tiefkühler, Trockenlager, Gemüselager, Bar.',1);
H('wareneingang','Wareneingang','Eine Lieferung ist da. Sie prüfen Menge und Preis und buchen die Ware ins Lager.',1);
H('entnahme','Entnahme','Ware geht aus dem Lager in die Küche. Der Bestand wird kleiner.',1);
H('schwund','Schwund','Ware, die Sie nicht verkaufen konnten: verdorben, verkocht, Bruch, Personalessen. Kostet Geld, darum aufschreiben.',1);
H('inventur','Inventur','Alles im Lager zählen. Die App vergleicht Ihre Zahl mit dem Bestand und zeigt, was fehlt.',1);
H('soll_ist','Soll und Ist','Soll ist, was laut App da sein müsste. Ist ist, was Sie wirklich gezählt haben.',1);
H('differenz','Differenz','Der Unterschied zwischen Soll und Ist in Euro. Minus heißt: Es fehlt Ware.',1);
H('lieferschein','Lieferschein','Der Zettel, den der Fahrer mitbringt. Darauf steht, was geliefert wurde. Die Nummer tragen Sie beim Wareneingang ein.',1);
H('reklamation','Reklamation','Etwas an der Lieferung stimmt nicht: zu wenig, falsche Ware, zu warm. Die App schreibt den Text für den Lieferanten.',1);
H('umsatz','Umsatz netto','Was Sie eingenommen haben, ohne Mehrwertsteuer.',1);
H('mwst','Mehrwertsteuer','Die Steuer im Preis. Auf Speisen sind es in Österreich 10 %. Die App rechnet den Wareneinsatz immer vom Preis ohne Steuer.',1);
H('portionen','Portionen','Wie oft ein Gericht verkauft wurde.',1);
H('kassendatei','Kassendatei','Eine Liste aus Ihrer Kasse: welches Gericht wie oft verkauft wurde. Sie laden die Datei in der Auswertung.',1);
H('zuordnung','Zuordnung','Die Kasse nennt ein Gericht oft anders als die App. Hier sagen Sie einmal, was zusammengehört.',1);
H('matrix','Menü-Matrix','Ein Bild mit vier Feldern. Oben rechts: Gerichte, die oft verkauft werden und viel bringen. Unten links: Gerichte, die beides nicht tun.',1);
H('sicherung','Sicherung','Eine Datei mit allen Daten der App. Aufheben, zum Beispiel auf einem USB-Stick. Damit holen Sie alles zurück.',1);
H('demodaten','Demodaten','Beispieldaten zum Ausprobieren. Die Karte ist echt, Preise und Bestände sind erfunden. Sie ersetzen sie nach und nach.',1);
H('preischeck','Preis-Check','Die App zeigt ein Produkt nach dem anderen. Sie tippen Ihren Einkaufspreis ein oder bestätigen den Richtwert.',1);
H('stempel','Stempel','Für jede erledigte Aufgabe im Aufbau gibt es einen Stempel auf Ihrer Stempelkarte.',1);

/* Navigation und Rahmen */
H('nav_aufbau','Aufbau', NAV_DESC.aufbau);
H('nav_dash','Heute', NAV_DESC.dash);
H('nav_menu','Speisekarte', NAV_DESC.menu);
H('nav_cards','Rezepturen', NAV_DESC.cards);
H('nav_labor','Rezept-Labor', NAV_DESC.labor);
H('nav_stock','Lager', NAV_DESC.stock);
H('nav_buy','Einkauf', NAV_DESC.buy);
H('nav_products','Produkte', NAV_DESC.products);
H('nav_report','Auswertung', NAV_DESC.report);
H('nav_setup','Einstellungen', NAV_DESC.setup);
H('suche','Suchen','Tippen Sie ein Gericht, ein Produkt oder eine Aktion ein, zum Beispiel „Schwund“. Am Computer geht auch Strg und K.');
H('design','Hell oder dunkel','Schaltet die Farben um. Dunkel ist angenehm in einer dunklen Küche.');
H('whoami','Wer arbeitet gerade?','Zeigt, wer angemeldet ist. Mitarbeiter sehen alles, ändern dürfen nur Küchenchef und Inhaber.');
H('rundgang','Rundgang','Zeigt Ihnen in zwei Minuten alle Bereiche der App.');
H('hilfe_schalter','Was ist das?','Der Hilfe-Schalter. Solange er an ist, erklärt die App alles, worauf Sie tippen. Es wird dabei nichts geändert.');
H('hier','So geht’s hier','Eine kurze Anleitung für genau diese Seite, in drei bis fünf Schritten.');
H('zurueck','Zurück','Bringt Sie eine Ebene zurück zur Liste.');

/* Listen: Werkzeuge */
H('ansicht','Ansicht','Dieselbe Liste in drei Formen: Liste, eng oder als Karten mit Bild.');
H('sortieren','Sortieren','Ein Tipp sortiert die Liste nach dieser Spalte. Noch ein Tipp dreht die Reihenfolge um.');
H('f_ueber','Über Ziel','Zeigt nur Gerichte, bei denen die Zutaten zu viel vom Preis fressen.');
H('f_ohne_rez','Ohne Rezeptur','Zeigt Gerichte, bei denen die App noch nicht weiß, was hineinkommt. Sie kann darum keinen Wareneinsatz rechnen.');
H('f_ohne_alg','Ohne Allergene','Zeigt Gerichte, bei denen die Allergene fehlen. In Österreich müssen sie auf der Karte stehen.');
H('f_ohne_foto','Ohne Foto','Zeigt Gerichte ohne Bild.');
H('f_kategorie','Kategorie wählen','Zeigt nur eine Kategorie oder nur eine Saison.');
H('preisfeld','Preisfeld','Der Verkaufspreis mit Steuer. Tippen Sie hinein, schreiben Sie den neuen Preis und drücken Sie Enter.');
H('status','Status','Zeigt, was bei diesem Gericht noch fehlt: Rezeptur oder Allergene. Der Stern heißt Empfehlung des Hauses.');
H('reiter_menu','Reiter der Speisekarte','Kalkulation ist zum Rechnen. Gestalten & PDF macht die Karte für die Gäste. Saison & Aktionen plant das Jahr. Aufbau & Reihenfolge ordnet die Karte.');

/* Speisekarte */
H('neu_gericht','Neues Gericht','Legt ein neues Gericht auf der Speisekarte an: Name, Preis, Kategorie.');
H('gericht_bearbeiten','Gericht bearbeiten','Name, Beschreibung, Preis, Saison und Allergene dieses Gerichts ändern.');
H('gericht_foto','Foto','Ein Foto für dieses Gericht aufnehmen oder aussuchen.');
H('pdf','Als PDF speichern','Macht aus der Gästekarte eine Datei. Die können Sie drucken oder verschicken.');
H('drucken','Drucken','Schickt die Seite an den Drucker.');
H('gdate','Datum der Karte','Die Karte zeigt, was an diesem Tag gilt: Saison, Wochentag und Aktionen.');
H('gstil','Gestaltung','Drei fertige Stile für die Gästekarte. Ein Tipp wechselt den Stil, der Inhalt bleibt gleich.');
H('ausblenden','Ausblenden','Das Gericht bleibt in der App, steht aber nicht auf der Gästekarte.');
H('reihenfolge','Reihenfolge','Schiebt das Gericht oder die Kategorie auf der Karte nach oben oder unten.');

/* Rezepturen */
H('neu_rezept','Neue Rezeptur','Legt eine leere Rezeptur für ein Gericht an. Danach kommen die Zutaten auf den Teller.');
H('neu_basis','Neues Basisrezept','Für alles, was Sie vorkochen: Fond, Teig, Dressing.');
H('r_typ','Gerichte oder Basisrezepte','Gerichte gehen an den Gast. Basisrezepte kochen Sie vor und verwenden sie in Gerichten.');
H('zutat_plus','Zutat dazu','Öffnet die Liste aller Produkte und Basisrezepte. Ein Tipp legt die Zutat auf den Teller.');
H('zutat_weg','Vom Teller nehmen','Nimmt diese Zutat aus der Rezeptur. Sie können es gleich danach rückgängig machen.');
H('menge','Menge','Wie viel von dieser Zutat in eine Portion kommt. Zahl eintippen und Enter drücken.');
H('teller_tabelle','Teller oder Tabelle','Dieselben Zutaten als Bild oder als Tabelle mit allen Spalten.');
H('schritt','Zubereitung','Schritt für Schritt aufschreiben, wie das Gericht gemacht wird. Jeder Schritt kann ein Foto haben.');
H('portionsgewicht','Portionsgewicht','Wie viel Gramm eine fertige Portion wiegt.');
H('rez_foto','Foto der Rezeptur','So soll das Gericht am Teller aussehen. Hilft allen, die es nachkochen.');
H('duplizieren','Duplizieren','Macht eine Kopie dieser Rezeptur. Gut für eine Variante.');
H('rez_loeschen','Rezeptur löschen','Löscht diese Rezeptur. Das Gericht bleibt auf der Karte, aber ohne Kalkulation.');
H('auf_karte','Auf die Karte','Setzt dieses Gericht mit einem Preisvorschlag auf die Speisekarte.');

/* Lager */
H('b_wareneingang','Wareneingang buchen','Eine Lieferung ist da. Hier tragen Sie ein, was gekommen ist. Der Bestand wird größer.');
H('b_entnahme','Entnahme buchen','Ware geht in die Küche. Der Bestand wird kleiner.');
H('b_schwund','Schwund buchen','Ware ist verdorben oder verkocht. Mit Grund aufschreiben, damit Sie sehen, wo Geld verloren geht.');
H('b_verkauf','Verkäufe buchen','Tragen Sie ein, was heute verkauft wurde. Die App zieht die Zutaten vom Lager ab.');
H('fuellstand','Füllstand','Der Balken zeigt, wie voll das Lager bei diesem Artikel ist. Rot heißt: unter dem Mindestbestand.');
H('storno','Buchung zurücknehmen','Macht diese Buchung rückgängig. Der Bestand ist danach wie vorher.');
H('inv_start','Inventur starten','Beginnt eine neue Zählung. Sie können unterbrechen und später weiterzählen.');
H('inv_fertig','Inventur abschließen','Setzt den Bestand auf Ihre gezählten Mengen. Die Differenz wird gespeichert.');
H('inv_weg','Inventur verwerfen','Wirft die laufende Zählung weg. Der Bestand bleibt, wie er war.');
H('inv_feld','Gezählte Menge','Tragen Sie ein, was wirklich da ist. Leer lassen heißt: nicht gezählt.');

/* Einkauf */
H('best_neu','Neue Bestellung','Lieferant wählen. Die App schlägt vor, was unter dem Mindestbestand liegt.');
H('best_vorbereiten','Bestellung vorbereiten','Legt einen Entwurf für diesen Lieferanten an. Gesendet wird erst, wenn Sie es sagen.');
H('best_wie_zuletzt','Wie zuletzt','Nimmt dieselben Artikel und Mengen wie bei der letzten Bestellung.');
H('best_vorschlag','Vorschlag laden','Fügt alle Artikel dazu, die bei diesem Lieferanten unter dem Mindestbestand liegen.');
H('best_gesendet','Als gesendet markieren','Erst tippen, wenn die Bestellung wirklich beim Lieferanten ist. Danach wartet die App auf die Lieferung.');
H('best_kanal','E-Mail oder WhatsApp','Öffnet Ihr Mail-Programm oder WhatsApp mit dem fertigen Bestelltext. Abschicken müssen Sie selbst.');
H('best_loeschen','Entwurf löschen','Löscht diese Bestellung, solange sie noch nicht gesendet ist.');
H('best_menge','Bestellmenge','Wie viele Gebinde Sie bestellen. Daneben steht, wie viel das in kg, Liter oder Stück ist.');
H('lief_neu','Lieferant anlegen','Name, Kontakt, Bestelltage, Liefertage und Annahmeschluss eines Lieferanten.');
H('r_alles','Alles wie bestellt','Trägt bei jedem Artikel die bestellte Menge als geliefert ein. Danach ändern Sie nur, was nicht stimmt.');
H('r_preis','Preis laut Rechnung','Steht auf der Rechnung ein anderer Preis? Hier eintragen. Die App merkt sich den neuen Einkaufspreis.');
H('r_buchen','Einbuchen','Bucht die Lieferung ins Lager. Bei Fehlern schreibt die App eine Reklamation.');
H('r_status','Zustand der Ware','In Ordnung, zu wenig, fehlt, beschädigt oder falscher Artikel. Alles außer „in Ordnung“ kommt in die Reklamation.');
H('r_temp','Temperatur','Bei Kühlware die gemessene Temperatur bei der Übernahme. Wichtig für die Hygiene-Aufzeichnung.');

/* Produkte */
H('prod_neu','Neues Produkt','Legt eine neue Zutat an: Name, Einheit, Einkaufspreis, Lieferant.');
H('prod_preis','Einkaufspreis','Was Sie dem Lieferanten zahlen, ohne Steuer, je kg, Liter oder Stück. Eintippen und Enter drücken.');
H('prod_ok','Richtwert bestätigen','Der Beispielpreis stimmt ungefähr? Dann bestätigen. Er gilt ab jetzt als Ihr Preis.');
H('prod_alle_ok','Alle bestätigen','Bestätigt alle Richtwerte, die gerade in der Liste stehen. Nur tippen, wenn Sie die Preise angesehen haben.');
H('prod_import','Preisliste importieren','Lädt eine Preisliste vom Lieferanten als Datei. Die App zeigt vorher, was sich ändert.');
H('pc_start','Preis-Check starten','Die App zeigt ein Produkt nach dem anderen. Sie tippen Ihren Preis ein. Enter geht weiter.');
H('pc_ok','Richtwert stimmt','Der gezeigte Preis passt. Er wird als Ihr Preis übernommen.');
H('pc_skip','Überspringen','Dieses Produkt jetzt nicht. Es kommt beim nächsten Preis-Check wieder.');
H('pc_feld','Ihr Einkaufspreis','Netto, wie auf der Rechnung. Leer lassen, wenn der Richtwert stimmt.');
H('prod_stand','Stand','Zeigt, ob der Preis noch ein Richtwert ist oder wann Sie ihn zuletzt bestätigt haben.');

/* Auswertung */
H('rp_zeitraum','Zeitraum','Tag, Woche, Monat oder ein eigener Zeitraum. Die Pfeile gehen einen Schritt zurück oder vor.');
H('rp_vergleich','Vergleich','Stellt die Zahlen neben den Zeitraum davor oder neben dasselbe im Vorjahr.');
H('rp_datei','Kassendatei wählen','Wählen Sie die Datei, die Ihre Kasse ausgibt. Die App zeigt zuerst eine Vorschau.');
H('rp_beispiel','Beispiel einfügen','Füllt das Feld mit erfundenen Zeilen. So sehen Sie, wie eine Kassendatei aussehen soll.');
H('rp_pruefen','Prüfen','Liest die Datei und zeigt, was importiert würde. Noch wird nichts gespeichert.');
H('rp_csv','Tabelle (CSV)','Speichert die Zahlen als Datei für Excel oder den Steuerberater.');
H('rp_bericht','Bericht drucken','Macht aus der Auswertung eine Seite zum Drucken oder als PDF.');
H('rp_delta','Δ Menge','Wie viele Portionen mehr oder weniger als im Vergleichszeitraum.');
H('rp_anteil','Anteil','Wie viel Prozent aller verkauften Portionen auf dieses Gericht fallen.');

/* Einstellungen */
H('s_sicherung','Sicherung erstellen','Speichert alle Daten als Datei. Am besten einmal pro Woche.');
H('s_laden','Sicherung laden','Holt Daten aus einer Sicherungsdatei zurück. Die jetzigen Daten werden dabei ersetzt.');
H('s_reset','Demodaten wiederherstellen','Ersetzt alles durch die Beispieldaten. Ihre eigenen Eingaben sind danach weg.');
H('s_rolle','Rolle wechseln','Stellt um, wer gerade arbeitet. Mitarbeiter sehen alles, ändern dürfen nur Küchenchef und Inhaber.');
H('s_modus','Einfach oder Alles zeigen','Einfach zeigt nur das Wichtigste mit großen Knöpfen. Alles zeigen bringt alle Spalten und Werkzeuge.');
H('s_limit','Freigabe-Limit','Bestellungen über diesem Betrag muss der Inhaber erst erlauben.');
H('lab_erfinden','Rezepte erfinden','Die App schlägt Gerichte aus Ihren Zutaten vor, mit Mengen und Wareneinsatz.');
H('mission_start','Aufgabe starten','Bringt Sie an die richtige Stelle und zeigt, wie es geht.');
H('station','Station','Sechs Stationen zeigen, wie viel von Ihrem Betrieb schon in der App steht. Die App rechnet das aus Ihren Daten.');

/* Wo welche Erklärung hängt: [Selektor, Schlüssel]. Der erste Treffer zählt. */
const HELP_SEL = [
  ['.nav-i[data-tab="aufbau"]','nav_aufbau'],['.nav-i[data-tab="dash"]','nav_dash'],['.nav-i[data-tab="menu"]','nav_menu'],['.nav-i[data-tab="cards"]','nav_cards'],
  ['.nav-i[data-tab="labor"],.m-only [data-tab="labor"]','nav_labor'],['.nav-i[data-tab="stock"]','nav_stock'],['.nav-i[data-tab="buy"]','nav_buy'],
  ['.nav-i[data-tab="products"],.m-only [data-tab="products"]','nav_products'],['.nav-i[data-tab="report"],.m-only [data-tab="report"]','nav_report'],['.nav-i[data-tab="setup"]','nav_setup'],
  ['[data-act="palette"]','suche'],['[data-act="theme"]','design'],['#whoami','whoami'],['[data-act="tourMain"]','rundgang'],['[data-act="helpMode"]','hilfe_schalter'],['[data-act="guideHere"]','hier'],['#app .back','zurueck'],
  ['#app .vsw','ansicht'],['#app table.lt thead th button[data-act="lsort"]','sortieren'],
  ['[data-act="sec"][data-id="over"],[data-act="goMenu"][data-id="over"]','f_ueber'],['[data-act="sec"][data-id="none"],[data-act="goMenu"][data-id="none"]','f_ohne_rez'],['[data-act="sec"][data-id="noalg"],[data-act="goMenu"][data-id="noalg"]','f_ohne_alg'],['[data-act="sec"][data-id="nophoto"]','f_ohne_foto'],['#app .sel-cat','f_kategorie'],
  ['#app input[data-mp]','preisfeld'],['#app .lt-st','status'],['#app [data-act="mtab"]','reiter_menu'],
  ['#app [data-act="newMenu"]','neu_gericht'],['#app button[data-act="editMenu"]','gericht_bearbeiten'],['#app [data-act="photoMenu"]','gericht_foto'],['#app [data-pdf]','pdf'],['#app [data-act="printMenu"],#app [data-act="printCard"],#app [data-act="ordPrint"]','drucken'],
  ['#gdate,#app [data-act="gdate"]','gdate'],['#app [data-act="gStyle"]','gstil'],['#app [data-act="itemHide"]','ausblenden'],['#app [data-act="itemMove"],#app [data-act="secMove"]','reihenfolge'],['#app [data-act="gseason"],#app [data-act="editSeason"]','saison'],['#app [data-act="newSpecial"],#app [data-act="editSpecial"]','aktion'],
  ['#app [data-act="newCard"][data-id="dish"]','neu_rezept'],['#app [data-act="newCard"][data-id="semi"]','neu_basis'],['#app [data-act="ctype"]','r_typ'],['#app [data-act="tellerPick"]','zutat_plus'],['#app [data-act="delLine"]','zutat_weg'],
  ['#app input[data-lf="qty"]','menge'],['#app [data-act="tellerMode"]','teller_tabelle'],['#app [data-act="stepAdd"],#app textarea[data-step]','schritt'],['#cf-yieldG','portionsgewicht'],['#app [data-act="photoCard"]','rez_foto'],['#app [data-act="dupCard"]','duplizieren'],['#app [data-act="delCard"]','rez_loeschen'],['#app [data-act="toMenu"]','auf_karte'],
  ['#app .plate','teller'],['#sim','preissim'],['#portions','produktionsmenge'],['#app [data-act="pcFor"]','preischeck'],
  ['#app [data-act="moveDlg"][data-id^="in"],#app [data-act="ordRecv"]','b_wareneingang'],['#app [data-act="moveDlg"][data-id^="out"]','b_entnahme'],['#app [data-act="moveDlg"][data-id^="waste"]','b_schwund'],['#app [data-act="sales"]','b_verkauf'],
  ['#app .lvl,#app .level','fuellstand'],['#app [data-act="moveUndo"]','storno'],['#app [data-act="invStart"]','inv_start'],['#app [data-act="invFinish"]','inv_fertig'],['#app [data-act="invCancel"]','inv_weg'],['#app input[data-inv]','inv_feld'],['#app [data-act="loc"]','lagerort'],
  ['#app [data-act="buyNew"]','best_neu'],['#app [data-act="ordNew"]','best_vorbereiten'],['#app [data-act="ordRe"]','best_wie_zuletzt'],['#app [data-act="olSuggest"]','best_vorschlag'],['#app [data-act="ordMarkSent"]','best_gesendet'],['#app [data-act="ordOpened"]','best_kanal'],['#app [data-act="ordDel"]','best_loeschen'],['#app input[data-ol]','best_menge'],['#app [data-act="supEdit"]','lief_neu'],
  ['#app [data-act="rAll"]','r_alles'],['#app input[data-rp]','r_preis'],['#app [data-act="rBook"]','r_buchen'],['#rTemp','r_temp'],['#app select[data-rs]','r_status'],['#rNo','lieferschein'],
  ['#app [data-act="newProd"]','prod_neu'],['#app input[data-pp]','prod_preis'],['#app [data-act="pConfirm"]','prod_ok'],['#app [data-act="pConfirmAll"]','prod_alle_ok'],['#app [data-act="plImport"]','prod_import'],['#app [data-act="pcStart"]','pc_start'],['#app [data-act="pcOk"]','pc_ok'],['#app [data-act="pcSkip"]','pc_skip'],['#pcIn','pc_feld'],['#app [data-act="pFilter"][data-id="demo"]','richtwert'],
  ['#app .rp-period [data-act="rpUnit"],#app [data-act="rpStep"]','rp_zeitraum'],['#app [data-act="rpCmp"]','rp_vergleich'],['#app [data-act="rpFile"]','rp_datei'],['#app [data-act="rpSample"]','rp_beispiel'],['#app [data-act="rpAnalyse"]','rp_pruefen'],['#app [data-act="rpCsv"]','rp_csv'],['#app [data-act="rpPrint"]','rp_bericht'],['#app [data-act="rpTab"][data-id="import"]','kassendatei'],['#app [data-act="rpTab"][data-id="map"]','zuordnung'],
  ['#app [data-act="export"]','s_sicherung'],['#app [data-act="importPick"]','s_laden'],['#app [data-act="reset"]','s_reset'],['#app [data-act="userSwitch"]','s_rolle'],['#app [data-act="guideMode"]','s_modus'],['#s-target','ziel_we'],['#s-vat','mwst'],['#app [data-us="limit"]','s_limit'],
  ['#app [data-act="labGen"]','lab_erfinden'],['#app [data-act="missionGo"]','mission_start'],['#app .au-row','station'],['#app .stamp','stempel'],
];
/* Tabellenköpfe und Kennzahlen: nach ihrem Text */
const HELP_TXT = {
  'we':'wareneinsatz','wareneinsatz':'wareneinsatz','ø wareneinsatz':'we_pct','we %':'we_pct','we gesamt':'wareneinsatz','wareneinsatz pro portion':'wareneinsatz','wareneinsatz je gericht':'we_pct',
  'rohertrag':'rohertrag','rohertrag exkl. mwst.':'rohertrag','größter rohertrag':'rohertrag','aufschlagsfaktor':'aufschlag','putzverlust':'putzverlust','garverlust':'garverlust',
  'mindest':'mindestbestand','unter mindestbestand':'mindestbestand','lagerwert':'lagerwert','lagerort':'lagerort','füllstand':'fuellstand','soll':'soll_ist','ist gezählt':'soll_ist','differenz':'differenz','differenz letzte inventur':'differenz',
  'saison':'saison','allergene':'allergene','preis €':'prod_preis','stand':'prod_stand','= einheit':'gebinde','gebinde':'gebinde','annahmeschluss':'annahmeschluss','mindestbestellwert':'mindestbestellwert',
  'umsatz netto':'umsatz','umsatz brutto':'mwst','portionen':'portionen','anteil':'rp_anteil','δ menge':'rp_delta','menü-matrix':'matrix','kostenstruktur':'kostenstruktur','preis-simulator':'preissim','produktionsmenge':'produktionsmenge',
  'heute noch bestellen':'annahmeschluss','kalkuliert':'rezeptur','preis lt. rechnung':'r_preis','geliefert':'wareneingang','pro 100 g':'wareneinsatz','richtwert':'richtwert','zubereitung':'schritt','typ':'r_typ','kategorie':'kategorie',
};

/* ---------- Rundgang und Anleitungen ----------
   Schritt: {t Titel, x Text (auch Funktion), sel Ziel (Selektor, Liste oder Funktion), go vorher ausführen,
             do: {hint, init(ctx), done(ctx)} = der Mensch macht es selbst, when: nur wenn wahr} */
const gq = s => { for(const el of document.querySelectorAll(s)){ const r = el.getBoundingClientRect(); if(r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el; } return null; };
const gPanel = s => () => { const el = gq(s); return el ? (el.closest('.panel, section') || el) : null; };
const gNav = k => () => gq(`.side .nav-i[data-tab="${k}"]`) || gq(`.bottom .nav-i[data-tab="${k}"]`) || gq(`#app .m-only [data-tab="${k}"]`);
const gNavGo = k => () => { if(gq(`.side .nav-i[data-tab="${k}"]`) || document.querySelector(`.bottom .nav-i[data-tab="${k}"]`)){ view.card = null; view.order = null; view.recv = null; go(k); } else go('setup'); };
const gPhoneMore = k => () => !gq(`.side .nav-i[data-tab="${k}"]`) && !document.querySelector(`.bottom .nav-i[data-tab="${k}"]`) ? ' Am Handy steht das unter „Mehr“.' : '';
const gFirstDish = () => { const withMenu = S.cards.find(c => c.type === 'dish' && S.menu.some(m => m.card === c.id)); return withMenu || S.cards.find(c => c.type === 'dish') || S.cards[0]; };
const gSum = fn => { try { return JSON.stringify(fn()); } catch(e){ return ''; } };

const TOURS = {};
TOURS.main = {id:'main', name:'Rundgang', steps:[
  {t:'Aufbau', go:gNavGo('aufbau'), sel:gNav('aufbau'), x:'Hier fangen Sie an. Kleine Aufgaben führen Sie Schritt für Schritt durch die App. Für jede erledigte Aufgabe gibt es einen Stempel.'},
  {t:'Heute', go:gNavGo('dash'), sel:gNav('dash'), x:'Ihr Tagesblatt. Hier steht, was heute zu bestellen ist und welche Lieferung kommt. Schauen Sie jeden Morgen kurz hinein.'},
  {t:'Speisekarte', go:() => { view.mtab = 'calc'; gNavGo('menu')(); }, sel:gNav('menu'), x:'Alle Gerichte mit Preis. Sie sehen, was jedes Gericht in der Herstellung kostet. Hier machen Sie auch die Karte für die Gäste.'},
  {t:'Rezepturen', go:gNavGo('cards'), sel:gNav('cards'), x:'Rezeptur: Hier steht, was in ein Gericht kommt und was es kostet. Ein Tipp auf eine Zeile öffnet das Rezept.'},
  {t:'Der Teller', go:() => { const c = gFirstDish(); if(c){ setV('teller','teller'); go('cards', c.id); } }, sel:() => gq(window.innerWidth <= 900 ? '#app .plate' : '#app .teller') || gq('#app .teller-sec'), x:'So sieht ein Rezept aus. Jedes Stück am Teller ist eine Zutat. Je größer das Stück, desto mehr kostet sie.'},
  {t:'Rezept-Labor', go:gNavGo('labor'), sel:gNav('labor'), x:() => 'Zutaten übrig? Tippen Sie sie ein. Das Labor schlägt Gerichte daraus vor, mit Mengen und Kosten.' + gPhoneMore('labor')()},
  {t:'Lager', go:() => { view.stab = 'bestand'; gNavGo('stock')(); }, sel:gNav('stock'), x:'Was ist im Haus? Hier buchen Sie Lieferungen ein, schreiben Schwund auf und zählen bei der Inventur.'},
  {t:'Einkauf', go:() => { view.stab = 'bestellung'; gNavGo('buy')(); }, sel:gNav('buy'), x:'Beim Lieferanten bestellen. Die App weiß, was fehlt, und schlägt die Mengen vor. Kommt die Ware, prüfen Sie sie hier.'},
  {t:'Produkte & Preis-Check', go:gNavGo('products'), sel:gNav('products'), x:() => 'Jede Zutat mit ihrem Einkaufspreis. Im Preis-Check tragen Sie Ihre echten Preise ein, einen nach dem anderen. Erst dann stimmt die Rechnung.' + gPhoneMore('products')()},
  {t:'Auswertung', go:() => { view.rp.tab = 'sales'; gNavGo('report')(); }, sel:gNav('report'), x:() => 'Was wurde verkauft? Was hat es gebracht? Dafür laden Sie die Datei aus Ihrer Kasse.' + gPhoneMore('report')()},
  {t:'Einstellungen', go:gNavGo('setup'), sel:gNav('setup'), x:'Name, Steuer, Team und Sicherung. Hier stellen Sie auch um zwischen „Einfach“ und „Alles zeigen“.'},
  {t:'Suchen', sel:['.side [data-act="palette"]', '.topbar [data-act="palette"]'], x:'Sie finden etwas nicht? Tippen Sie hier ein Gericht, ein Produkt oder eine Aktion ein. Am Computer geht auch Strg und K.'},
  {t:'Was ist das?', sel:['.side [data-act="helpMode"]', '.topbar [data-act="helpMode"]'], x:'Der Hilfe-Schalter. Einschalten und auf etwas tippen, das Sie nicht kennen. Die App erklärt es und ändert dabei nichts. Das Fragezeichen neben jedem Titel zeigt, wie die Seite geht.'},
]};

TOURS.aufbau = {id:'aufbau', name:'Aufbau', steps:[
  {t:'Die nächste Aufgabe', sel:'#app .ms-next', x:'Hier steht immer, was als Nächstes dran ist. Der Knopf bringt Sie an die richtige Stelle und zeigt, wie es geht.'},
  {t:'Drei Stufen', sel:'#app .ms-tiers', x:'Start, Alltag, Profi. Sie müssen die Reihenfolge nicht einhalten. Die Zahl rechts zeigt, wie weit Sie sind.'},
  {t:'Stempelkarte', sel:'#app [data-act="goTab"][data-id="stempel"]', x:'Für jede erledigte Aufgabe gibt es einen Stempel. Hier sehen Sie alle auf einen Blick.'},
  {t:'Stand des Betriebs', sel:'#app .au-list', x:'Sechs Stationen zeigen, wie viel von Ihrem Betrieb schon in der App steht. Das rechnet die App aus Ihren Daten.'},
]};
TOURS.dash = {id:'dash', name:'Heute', steps:[
  {t:'Ihr Tag', sel:'#app .page-h > div', x:'Oben steht das Datum und ob heute noch etwas zu bestellen ist.'},
  {t:'Was zu tun ist', sel:'#app .day-sec', x:'Bestellungen und Lieferungen von heute. Der Knopf rechts in jeder Zeile führt direkt hin.'},
  {t:'Vier Zahlen', sel:'#app .tiles', x:'Was kosten Ihre Gerichte im Schnitt, wie viele sind durchgerechnet, was liegt im Lager, was fehlt. Ein Tipp auf Lagerwert öffnet das Lager.'},
  {t:'Wareneinsatz je Gericht', sel:gPanel('#app .bars'), x:'Jeder Balken ist ein Gericht. Der Strich ist Ihr Ziel. Ein langer roter Balken heißt: Dieses Gericht ist zu teuer in der Herstellung.'},
  {t:'Wareneingang', sel:'#app .page-h [data-act="moveDlg"]', x:'Ist eine Lieferung gekommen? Mit diesem Knopf buchen Sie die Ware ins Lager.'},
]};
TOURS.menu = {id:'menu', name:'Speisekarte', steps:[
  {t:'Vier Reiter', sel:() => { const b = gq('#app [data-act="mtab"]'); return b && b.parentNode; }, x:'Kalkulation ist zum Rechnen. „Gestalten & PDF“ macht die Karte für die Gäste. Die anderen zwei planen Saison und Reihenfolge.'},
  {t:'Die Liste', sel:['#app table.lt thead', '#app .dish-grid'], x:'Eine Zeile je Gericht: Preis, was die Zutaten kosten und was übrig bleibt. Ein Strich heißt: Es gibt noch keine Rezeptur.'},
  {t:'Preis ändern', sel:'#app input[data-mp]', x:'Der Preis lässt sich direkt in der Zeile ändern.', do:{hint:'Tippen Sie hier einen Preis ein und drücken Sie Enter. Den alten Preis können Sie danach wieder eintragen.', init:c => { c.v = gSum(() => S.menu.map(m => m.price)); }, done:c => c.v !== gSum(() => S.menu.map(m => m.price))}},
  {t:'Filter', sel:'#app .toolbar.filters', x:'„Ohne Rezeptur“ und „Ohne Allergene“ zeigen, wo noch Arbeit wartet. „Über Ziel“ zeigt die zu teuren Gerichte.'},
  {t:'Neues Gericht', sel:'#app .page-h [data-act="newMenu"]', x:'Ein neues Gericht kommt mit diesem Knopf auf die Karte.'},
]};
TOURS.alg = {id:'alg', name:'Allergene', steps:[
  {t:'Gerichte ohne Allergene', sel:'#app [data-act="sec"][data-id="noalg"]', x:'Der Filter zeigt jetzt nur Gerichte, bei denen die Allergene fehlen.'},
  {t:'Gericht öffnen', sel:() => gq('#app table.lt tbody button[data-act="editMenu"]') || gq('#app [data-act="editMenu"]'), x:'Der Stift öffnet das Gericht. Unten im Fenster kreuzen Sie die Allergene an.', do:{hint:'Tippen Sie auf den Stift, kreuzen Sie die Allergene an und speichern Sie.', init:c => { c.n = S.menu.filter(hasAlg).length; }, done:c => S.menu.filter(hasAlg).length > c.n}},
  {t:'Mit Rezeptur geht es von selbst', sel:'#app table.lt thead', x:'Hat ein Gericht eine Rezeptur, liest die App die Allergene aus den Zutaten. Dann müssen Sie nichts ankreuzen.'},
]};
TOURS.guest = {id:'guest', name:'Gestalten & PDF', steps:[
  {t:'Welcher Tag?', sel:gPanel('#gdate'), x:'Die Karte zeigt, was an diesem Tag gilt: Saison, Wochentag und Aktionen. „Heute“ ist der Normalfall.'},
  {t:'Gestaltung', sel:gPanel('#app [data-act="gStyle"]'), x:'Drei fertige Stile. Ein Tipp wechselt das Aussehen, der Inhalt bleibt gleich.'},
  {t:'Vorschau', sel:['#app .hs-stage', '#app .guest-prev', '#app .guest-wrap'], x:'So sehen die Gäste die Karte. Jede Änderung links sehen Sie hier sofort.'},
  {t:'Als PDF speichern', sel:'#app [data-pdf="printMenu"]', x:'Macht aus der Karte eine Datei zum Drucken oder Verschicken.', do:{ro:1, hint:'Tippen Sie auf „Als PDF speichern“. Das dauert ein paar Sekunden.', init:c => { c.n = gdActs().pdf; }, done:c => gdActs().pdf > c.n}},
]};
TOURS.plan = {id:'plan', name:'Saison & Aktionen', steps:[
  {t:'Das Jahr', sel:gPanel('#app .tl-bar'), x:'Die vier Balken sind Ihre Saisonen. Ein Tipp auf einen Balken ändert, von wann bis wann er gilt.'},
  {t:'Aktionen', sel:'#app .page-h [data-act="newSpecial"]', x:'Wildwochen, Silvester, Ostern: Eine Aktion ist eine eigene kleine Karte für ein paar Tage.'},
  {t:'Welches Gericht wann?', sel:gPanel('#app input[data-ms]'), x:'Ein Haken je Saison. Ohne Haken steht das Gericht in dieser Saison nicht auf der Karte.'},
]};
TOURS.layout = {id:'layout', name:'Aufbau & Reihenfolge', steps:[
  {t:'Kategorien', sel:'#app input[data-secname]', x:'Das sind die Überschriften Ihrer Karte. Den Namen ändern Sie direkt im Feld.'},
  {t:'Reihenfolge', sel:'#app [data-act="itemMove"]', x:'Die Pfeile schieben ein Gericht nach oben oder unten. So steht es dann auch auf der Gästekarte.'},
  {t:'Ausblenden', sel:'#app [data-act="itemHide"]', x:'Das Auge nimmt ein Gericht von der Gästekarte. In der App bleibt es erhalten.'},
  {t:'Neue Kategorie', sel:'#app [data-act="addSec"]', x:'Eine neue Überschrift für die Karte, zum Beispiel „Für Kinder“.'},
]};
TOURS.cards = {id:'cards', name:'Rezepturen', steps:[
  {t:'Gerichte und Basisrezepte', sel:() => { const b = gq('#app [data-act="ctype"]'); return b && b.parentNode; }, x:'Gerichte gehen an den Gast. Basisrezepte kochen Sie vor: Fond, Teig, Dressing.'},
  {t:'Neue Rezeptur', sel:'#app .page-h [data-act="newCard"][data-id="dish"]', x:'Legt ein leeres Rezept an. Danach kommen die Zutaten auf den Teller.'},
  {t:'Rezept öffnen', sel:() => gq('#app table.lt tbody tr.row') || gq('#app .rc'), x:'Jede Zeile ist eine Rezeptur.', do:{ro:1, hint:'Tippen Sie auf eine Zeile, um das Rezept zu öffnen.', done:() => !!(view.card && C(view.card))}},
  {t:'Der Teller', sel:['#app .teller', '#app .teller-sec'], x:'Jedes Stück ist eine Zutat. Je größer das Stück, desto mehr kostet sie. Das Fragezeichen oben erklärt diese Seite genauer.'},
]};
TOURS.card = {id:'card', name:'Rezeptur', steps:[
  {t:'Der Teller', sel:'#app .plate', x:'In der Mitte steht, was eine Portion kostet. Jedes Stück im Ring ist eine Zutat. Das größte Stück ist die teuerste Zutat.'},
  {t:'Menge ändern', sel:'#app input[data-lf="qty"]', x:'Jede Zutat hat eine Menge für eine Portion.', do:{hint:'Ändern Sie hier eine Menge und drücken Sie Enter. Der Teller rechnet sofort neu.', init:c => { c.v = gSum(() => C(view.card).items.map(i => i.qty)); }, done:c => c.v !== gSum(() => C(view.card).items.map(i => i.qty))}},
  {t:'Zutat dazu', sel:'#app [data-act="tellerPick"]', x:'Öffnet die Liste aller Produkte. Ein Tipp legt die Zutat auf den Teller.'},
  {t:'Zubereitung', sel:gPanel('#app [data-act="stepAdd"]'), x:'Schreiben Sie Schritt für Schritt auf, wie das Gericht gemacht wird. Jeder Schritt kann ein Foto haben.'},
  {t:'Preis-Simulator', sel:gPanel('#sim'), x:'Schieben Sie den Regler: Was bleibt übrig, wenn das Gericht mehr oder weniger kostet? Erst „Übernehmen“ ändert den Preis.'},
  {t:'Foto', sel:'#app .hero [data-act="photoCard"]', x:'Ein Foto zeigt allen, wie das Gericht am Teller aussehen soll.'},
]};
TOURS.labor = {id:'labor', name:'Rezept-Labor', steps:[
  {t:'Zutaten eintippen', sel:'#labIn', x:'Was haben Sie da? Zwei, drei Zutaten reichen.', do:{ro:1, hint:'Tippen Sie hier Zutaten ein, zum Beispiel: Erdäpfel, Speck, Bergkäse.', init:c => { c.v = (document.getElementById('labIn')||{}).value || ''; }, done:c => { const v = (document.getElementById('labIn')||{}).value || ''; return v !== c.v && v.trim().length >= 4; }}},
  {t:'Rahmen', sel:gPanel('#app [data-lab]'), x:'Was soll es werden und was darf es kosten? Das Labor hält sich daran.'},
  {t:'Rezepte erfinden', sel:'#app [data-act="labGen"]', x:'Die App schlägt Gerichte vor, mit Mengen und Wareneinsatz. Was Ihnen gefällt, übernehmen Sie als Rezeptur.'},
]};
TOURS.stock = {id:'stock', name:'Lager', steps:[
  {t:'Vier Zahlen', sel:'#app .tiles', x:'Was die Ware im Haus wert ist und wie viele Artikel unter dem Mindestbestand liegen.'},
  {t:'Bestand, Buchungen, Inventur', sel:() => { const b = gq('#app .toolbar [data-act="stab"]'); return b && b.parentNode; }, x:'Bestand zeigt, was da ist. Buchungen zeigt, was sich geändert hat. Inventur ist zum Zählen.'},
  {t:'Lieferung für einen Artikel', sel:'#app tbody [data-act="moveDlg"][data-id^="in"]', x:'Das Plus bucht Ware für diesen einen Artikel ein. Das Minus daneben ist die Entnahme für die Küche.'},
  {t:'Schwund', sel:'#app .page-h [data-act="moveDlg"][data-id="waste"]', x:'Etwas ist verdorben oder verkocht? Hier aufschreiben, mit Grund. So sehen Sie, wo Geld verloren geht.'},
  {t:'Lagerorte', sel:() => { const b = gq('#app [data-act="loc"]'); return b && b.parentNode; }, x:'Zeigt nur einen Ort: Kühlhaus, Tiefkühler, Trockenlager.'},
]};
TOURS.moves = {id:'moves', name:'Buchungen', steps:[
  {t:'Alle Bewegungen', sel:['#app ul.moves', '#app .panel.flush'], x:'Jede Zeile ist eine Buchung: Lieferung, Entnahme, Schwund, Verkauf. Die neueste steht oben.'},
  {t:'Zurücknehmen', sel:'#app [data-act="moveUndo"]', x:'Vertippt? Der Pfeil macht eine Buchung rückgängig. Der Bestand ist danach wie vorher.'},
]};
TOURS.inventur = {id:'inventur', name:'Inventur', steps:[
  {t:'Inventur starten', when:() => !S.invDraft, sel:'#app [data-act="invStart"]', x:'Eine Inventur heißt: alles zählen. Sie können unterbrechen und später weitermachen.', do:{ro:1, hint:'Tippen Sie auf „Inventur starten“.', done:() => !!S.invDraft}},
  {t:'Zählen', sel:'#app input[data-inv]', x:'Links steht, was laut App da sein müsste.', do:{ro:1, hint:'Zählen Sie diesen Artikel und tippen Sie die Menge ein.', init:c => { c.v = gSum(() => S.invDraft.counts); }, done:c => !!S.invDraft && c.v !== gSum(() => S.invDraft.counts)}},
  {t:'Differenz', sel:['#app .inv-sum', '#app table thead'], x:'Die App zeigt sofort den Unterschied in Euro. Minus heißt: Es fehlt Ware.'},
  {t:'Abschließen', sel:'#app [data-act="invFinish"]', x:'Wenn alles gezählt ist: abschließen. Der Bestand wird auf Ihre gezählten Mengen gesetzt.'},
]};
TOURS.buy = {id:'buy', name:'Einkauf', next:() => view.order && ORD(view.order) && !view.recv ? 'order' : null, steps:[
  {t:'Vier Zahlen', sel:'#app .tiles', x:'Wie viele Lieferanten heute noch auf eine Bestellung warten und was heute geliefert wird.'},
  {t:'Heute bestellen', sel:['#app .ord-top .panel', '#app .ord-top', '#app .lo-grid'], x:'Diese Lieferanten nehmen heute Bestellungen an. Daneben steht, bis wann.'},
  {t:'Lieferanten', sel:'#app .toolbar [data-act="stab"][data-id="lieferanten"]', x:'Hier stehen Kontakt, Bestelltage und Liefertage jedes Lieferanten.'},
  {t:'Bestellung vorbereiten', sel:() => gq('#app [data-act="ordNew"]') || gq('#app [data-act="buyNew"]'), x:'Die App legt einen Entwurf an und schlägt vor, was fehlt. Gesendet wird erst, wenn Sie es sagen.', do:{ro:1, hint:'Tippen Sie auf den Knopf, um eine Bestellung vorzubereiten.', done:() => !!(view.order && ORD(view.order))}},
]};
TOURS.suppliers = {id:'suppliers', name:'Lieferanten', steps:[
  {t:'Ein Lieferant', sel:['#app article.lo', '#app [data-act="supEdit"][data-id^="sup"]'], x:'Kontakt, Bestelltage, Liefertage und Annahmeschluss. Daraus weiß die App, wann Sie bestellen müssen.'},
  {t:'Neuer Lieferant', sel:'#app [data-act="supEdit"]:not([data-id^="sup"])', x:'Legt einen neuen Lieferanten an.'},
  {t:'Preisentwicklung', sel:() => { const h = [...document.querySelectorAll('#app h2')].find(x => /Preisentwicklung/.test(x.textContent)); return h ? (h.nextElementSibling || h) : null; }, x:'Zeigt, welche Artikel teurer oder billiger geworden sind.'},
]};
TOURS.order = {id:'order', name:'Bestellung', steps:[
  {t:'Positionen', sel:['#app table.otab', '#app .panel.flush'], x:'Was Sie bestellen. Die App hat vorgeschlagen, was unter dem Mindestbestand liegt.'},
  {t:'Menge', sel:'#app input[data-ol]', x:'Die Menge ist in Gebinden. Daneben steht, wie viel das ist.', do:{ro:1, hint:'Ändern Sie hier eine Menge und drücken Sie Enter.', init:c => { c.v = gSum(() => ORD(view.order).lines.map(l => l.n)); }, done:c => c.v !== gSum(() => ORD(view.order).lines.map(l => l.n))}},
  {t:'Noch etwas dazu', sel:'#olAdd', x:'Hier fügen Sie einen weiteren Artikel dieses Lieferanten dazu.'},
  {t:'Senden', sel:gPanel('#app [data-act="ordOpened"], #app [data-act="ordCopy"]'), x:'E-Mail oder WhatsApp öffnet den fertigen Bestelltext. Abschicken müssen Sie selbst.'},
  {t:'Als gesendet markieren', sel:'#app [data-act="ordMarkSent"]', x:'Erst tippen, wenn die Bestellung wirklich beim Lieferanten ist. Dann wartet die App auf die Lieferung.'},
]};
TOURS.recv = {id:'recv', name:'Wareneingang', steps:[
  {t:'Lieferung prüfen', sel:['#app table.recv', '#app .panel.flush'], x:'Links steht, was bestellt war. Sie tragen ein, was wirklich gekommen ist.'},
  {t:'Alles wie bestellt', sel:'#app [data-act="rAll"]', x:'Stimmt die Lieferung, reicht ein Tipp.', do:{ro:1, hint:'Tippen Sie auf „Alles wie bestellt“. Danach ändern Sie nur, was nicht stimmt.', done:() => { const o = ORD(view.order); return !!o && o.lines.length > 0 && o.lines.every(l => l.delivered != null && l.delivered !== ''); }}},
  {t:'Preis laut Rechnung', sel:'#app input[data-rp]', x:'Steht auf der Rechnung ein anderer Preis? Hier eintragen. Die App merkt sich den neuen Einkaufspreis.'},
  {t:'Lieferschein und Temperatur', sel:() => { const a = gq('#rNo'); return a ? (a.closest('.recv-f') || a.closest('.panel-f') || a) : null; }, x:'Nummer vom Lieferschein und bei Kühlware die Temperatur. Ein Foto vom Lieferschein geht auch.'},
  {t:'Einbuchen', sel:'#app [data-act="rBook"]', x:'Bucht die Ware ins Lager. Fehlt etwas, schreibt die App die Reklamation für den Lieferanten.'},
]};
TOURS.products = {id:'products', name:'Produkte', steps:[
  {t:'Die Liste', sel:'#app table.lt thead', x:'Eine Zeile je Zutat. Wichtig ist der Preis: Was Sie dem Lieferanten zahlen, ohne Steuer.'},
  {t:'Preis eintragen', sel:'#app input[data-pp][data-pf="price"]', x:'Schauen Sie auf Ihre letzte Rechnung.', do:{hint:'Tippen Sie hier Ihren echten Preis ein und drücken Sie Enter.', init:c => { c.v = gSum(() => S.products.map(p => [p.price, !!p.priceDemo])); }, done:c => c.v !== gSum(() => S.products.map(p => [p.price, !!p.priceDemo]))}},
  {t:'Richtwert bestätigen', sel:'#app [data-act="pConfirm"]', x:'Stimmt der Beispielpreis ungefähr? Dann reicht ein Tipp auf „Bestätigen“.'},
  {t:'Preis-Check', sel:'#app .page-h [data-act="pcStart"]', x:'Schneller geht es im Preis-Check: ein Produkt nach dem anderen, Enter geht weiter.'},
]};
TOURS.pcheck = {id:'pcheck', name:'Preis-Check', steps:[
  {t:'Ein Produkt nach dem anderen', sel:'#app .pc-card', x:'Oben steht der Lieferant, groß das Produkt. Links der Richtwert, das ist ein Beispielpreis.'},
  {t:'Ihr Preis', sel:() => { const i = gq('#pcIn'); return i ? (i.closest('.pc-in') || i) : null; }, x:'Netto, wie auf der Rechnung.', do:{hint:'Tippen Sie Ihren Einkaufspreis ein und drücken Sie Enter. Stimmt der Richtwert, drücken Sie nur Enter.', init:c => { c.n = view.pc ? view.pc.saved + view.pc.confirmed : 0; }, done:c => !!view.pc && view.pc.saved + view.pc.confirmed > c.n}},
  {t:'Das ändert sich', sel:'#app .pc-fb', x:'Die App zeigt sofort, bei welchen Gerichten sich der Wareneinsatz geändert hat.'},
  {t:'Überspringen oder aufhören', sel:'#app .pc-acts', x:'Preis nicht zur Hand? Überspringen. Mit „Beenden“ oben hören Sie auf, alles bleibt gespeichert.'},
]};
TOURS.report = {id:'report', name:'Auswertung', steps:[
  {t:'Zeitraum', sel:'#app .rp-period', x:'Tag, Woche, Monat oder Saison. Die Pfeile gehen einen Schritt zurück oder vor.'},
  {t:'Die wichtigsten Zahlen', sel:'#app .tiles', x:'Was eingenommen wurde, wie viele Portionen verkauft wurden und was nach den Zutaten übrig bleibt.'},
  {t:'Jedes Gericht', sel:['#app table.rp-items thead', '#app .lt-wrap'], x:'Wie oft wurde ein Gericht verkauft und was hat es gebracht? Ein Tipp auf eine Spalte sortiert.'},
  {t:'Menü-Matrix', sel:() => { const h = [...document.querySelectorAll('#app h2')].find(x => /Menü-Matrix/.test(x.textContent)); return h ? h.closest('.panel') : null; }, x:'Oben rechts stehen Ihre besten Gerichte: oft verkauft und viel Ertrag. Unten links die Sorgenkinder.'},
  {t:'Kasse importieren', sel:'#app .toolbar [data-act="rpTab"][data-id="import"]', x:'Die Zahlen kommen aus Ihrer Kasse. Hier laden Sie die Datei.'},
]};
TOURS.rimport = {id:'rimport', name:'Kasse importieren', steps:[
  {t:'Datei wählen', sel:'#app [data-act="rpFile"]', x:'Ihre Kasse kann die Artikelumsätze als Datei ausgeben, meist als CSV oder Excel. Diese Datei wählen Sie hier.'},
  {t:'Zum Ausprobieren', sel:'#app [data-act="rpSample"]', x:'Noch keine Datei? Das Beispiel zeigt, wie die Zeilen aussehen sollen. Es sind erfundene Zahlen.'},
  {t:'Prüfen', sel:'#app [data-act="rpAnalyse"]', x:'Die App liest die Datei und zeigt eine Vorschau. Gespeichert wird erst, wenn Sie „Importieren“ tippen.'},
  {t:'Welche Kasse?', sel:() => { const h = [...document.querySelectorAll('#app h2')].find(x => /Kassen und ihre Exporte/.test(x.textContent)); return h ? h.closest('.panel') : null; }, x:'Hier steht für die üblichen Kassen, wo Sie den Export finden.'},
]};
TOURS.rmap = {id:'rmap', name:'Zuordnung', steps:[
  {t:'Was gehört zusammen?', sel:['#app .lt-wrap', '#app table', '#app .panel'], x:'Die Kasse nennt ein Gericht oft anders als die App. Hier sagen Sie einmal, was zusammengehört. Die App merkt es sich.'},
]};
TOURS.setup = {id:'setup', name:'Einstellungen', steps:[
  {t:'Hilfe', sel:'#app .gd-panel', x:'Rundgang, Begriffe und Stempelkarte. Hier stellen Sie auch um zwischen „Einfach“ und „Alles zeigen“.'},
  {t:'Ziel-Wareneinsatz', sel:() => { const i = gq('#s-target'); return i ? (i.closest('label') || i) : null; }, x:'Ihre Grenze. Kosten die Zutaten mehr als so viel Prozent vom Preis, zeigt die App das Gericht in Rot.'},
  {t:'Wer arbeitet gerade?', sel:gPanel('#app [data-act="userSwitch"]'), x:'Mitarbeiter sehen alles, ändern dürfen nur Küchenchef und Inhaber.'},
  {t:'Sicherung', sel:'#app [data-act="export"]', x:'Speichert alle Daten als Datei. Machen Sie das einmal pro Woche und heben Sie die Datei gut auf.'},
]};
