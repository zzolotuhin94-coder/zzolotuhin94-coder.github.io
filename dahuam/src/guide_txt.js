/* =====================================================================
   Hilfe: alle Texte.
   Bereiche in einem Satz, Erklärungen für „Was ist das?“, die Unterzeile je Seite,
   „So geht’s hier“ und der kurze Rundgang.
   Sprache: kurze Sätze, Küchenwörter, „Sie“.
   ===================================================================== */

/* ---------- Bereiche: ein Satz, wozu ---------- */
const NAV_DESC = {
  dash:'Was heute zu tun ist: Vorbereitung, bestellen, Eigenkontrolle, Lieferungen, Dienst.',
  vorb:'Die Vorbereitungsliste für heute und morgen, aus der Prognose gerechnet.',
  checkl:'Listen zum Abhaken beim Aufsperren, Zusperren und Putzen.',
  menu:'Alle Gerichte mit Preis. Hier machen Sie auch die Karte für die Gäste.',
  cards:'Was in ein Gericht kommt und was es kostet.',
  ware:'Was im Haus ist, was bestellt wird und was es kostet.',
  team:'Wer wann arbeitet und was verkauft wurde.',
  setup:'Betrieb, Sicherung und Hilfe.',
};
/* ---------- Unterzeile je Seite ---------- */
const SUB_LINE = {
  menu:'Preis, Wareneinsatz und Allergene je Gericht. Preis direkt in der Zeile ändern.',
  'menu/guest':'Gästekarte ansehen, gestalten und als PDF speichern.',
  'menu/plan':'Saisonzeiten festlegen und Aktionen planen. Die Gästekarte wechselt von selbst.',
  'menu/service':'Für den Service: was heute auf der Karte steht, was am Teller ist und welche Allergene drin sind.',
  cards:'Zutaten, Mengen, Zubereitung. Daraus kommen Wareneinsatz und Allergene.',
  stock:'Was ist im Haus und was ist es wert?',
  'stock/inventur':'Zählen, Differenz sehen, Bestand übernehmen.',
  'stock/buchungen':'Alle Lagerbewegungen, neueste zuerst. Der Pfeil nimmt eine Buchung zurück.',
  buy:'Wer liefert wann, was muss heute noch raus, was kommt.',
  'buy/lieferanten':'Bestelltage, Annahmeschluss, Liefertage und Kontakt je Lieferant.',
  products:'Einkaufspreis je Einheit, ohne Steuer. Ein Richtwert gilt, bis Sie Ihren Preis eintragen.',
  pcheck:'Artikel für Artikel: echten Preis eintippen oder Richtwert bestätigen. Enter geht weiter.',
  report:'Was verkauft wurde und was es gebracht hat.',
  'report/import':'Artikelumsätze aus der Kasse als Datei laden. Vor dem Import sehen Sie eine Vorschau.',
  'report/map':'Kassenartikel den Gerichten der App zuordnen, auch rückwirkend.',
  setup:'Betrieb, Sicherung und Hilfe.',
};
function subLine(){
  const t = view.tab; const sub = t === 'menu' ? view.mtab : t === 'stock' || t === 'buy' ? view.stab : t === 'report' ? (view.rp && view.rp.tab) : '';
  return SUB_LINE[t + '/' + sub] || SUB_LINE[t] || '';
}
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
H('richtwert','Richtwert','Ein ungefährer Preis aus den Beispieldaten. Er gilt nur, bis Sie Ihren echten Einkaufspreis eintragen oder bestätigen.',1);
H('putzverlust','Putzverlust','Was beim Putzen wegfällt: Schale, Strunk, Knochen. 20 % heißt: Von 1 kg bleiben 800 g.',1);
H('garverlust','Garverlust','Was beim Garen verloren geht, weil Wasser und Fett austreten. Ein Schnitzel wiegt nach der Pfanne weniger als davor.',1);
H('brutto_netto_g','Brutto, netto, fertig','Brutto ist die Ware, wie sie geliefert wird. Netto ist sie geputzt. Fertig ist sie gegart am Teller.',1);
H('mindestbestand','Mindestbestand','So viel soll immer im Haus sein. Liegt der Bestand darunter, schlägt die App eine Bestellung vor.',1);
H('annahmeschluss','Annahmeschluss','Bis zu dieser Uhrzeit nimmt der Lieferant Bestellungen an. Wer später bestellt, bekommt die Ware erst am nächsten Liefertag.',1);
H('gebinde','Gebinde','Die Packung, in der der Lieferant verkauft: Kiste, Sack, Karton, bei Getränken Flasche, Fass oder Kiste. Beispiel: 1 Sack Mehl = 25 kg.',1);
H('bestelltag','Bestelltag und Liefertag','Am Bestelltag nimmt der Lieferant Bestellungen an. Am Liefertag bringt er die Ware. Beides steht beim Lieferanten.',1);
H('mindestbestellwert','Mindestbestellwert','Unter diesem Betrag liefert der Lieferant nicht oder verlangt einen Zuschlag.',1);
H('bestellvorschlag','Bestellvorschlag','Die App rechnet aus, was unter dem Mindestbestand liegt, und schlägt die Menge vor. Sie können jede Zahl ändern.',1);
H('entwurf','Entwurf','Eine Bestellung, die noch nicht beim Lieferanten ist. Sie können sie ändern oder löschen.',1);
H('rezeptur','Rezeptur','Hier steht, was in ein Gericht kommt und was es kostet: Zutaten, Mengen, Zubereitung.',1);
H('basisrezept','Basisrezept','Etwas, das Sie vorkochen und in mehreren Gerichten brauchen: Fond, Teig, Dressing. Einmal anlegen, überall verwenden.',1);
H('charge','Charge','Die Menge, die Sie auf einmal herstellen. Beispiel: ein Topf Gulaschansatz mit 5 kg.',1);
H('ausbeute','Ausbeute','Wie viel Gramm am Ende herauskommen. Bei einem Gericht ist das die Portion, bei einem Basisrezept der ganze Topf.',1);
H('teller','Teller','Das Bild einer Rezeptur. Jedes Stück ist eine Zutat. Je größer das Stück, desto mehr kostet diese Zutat.',1);
H('kostenstruktur','Kostenstruktur','Welche Zutat wie viel vom Wareneinsatz ausmacht. Die teuerste steht oben. Dort lohnt sich das Sparen.',1);
H('preissim','Preis-Simulator','Ein Regler zum Ausprobieren: Was bleibt übrig, wenn das Gericht mehr oder weniger kostet? Erst „Übernehmen“ ändert den Preis.',1);
H('produktionsmenge','Produktionsmenge','Wie viel Ware Sie für eine bestimmte Zahl von Portionen brauchen. Praktisch fürs Vorbereiten.',1);
H('allergene','Allergene','Die 14 Stoffe, die auf der Karte stehen müssen, mit Buchstaben von A bis R. Die App liest sie aus den Zutaten der Rezeptur. Fehlt die Angabe bei einem Artikel, gilt das Gericht als unvollständig und steht auf der Karte mit °.',1);
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
H('mwst','Mehrwertsteuer','Die Steuer im Preis. Auf Speisen sind es in Österreich 10 %, auf Getränke 20 %. Die App rechnet den Wareneinsatz immer vom Preis ohne Steuer.',1);
H('portionen','Portionen','Wie oft ein Gericht verkauft wurde.',1);
H('kassendatei','Kassendatei','Eine Liste aus Ihrer Kasse: welches Gericht wie oft verkauft wurde. Sie laden die Datei in der Auswertung.',1);
H('zuordnung','Zuordnung','Die Kasse nennt ein Gericht oft anders als die App. Hier sagen Sie einmal, was zusammengehört.',1);
H('sicherung','Sicherung','Eine Datei mit allen Daten der App. Aufheben, zum Beispiel auf einem USB-Stick. Damit holen Sie alles zurück.',1);
H('demodaten','Beispieldaten','Daten zum Ausprobieren. Die Karte ist echt, Preise und Bestände sind erfunden. Sie ersetzen sie nach und nach, oder starten leer: Einstellungen, „Eigene Daten“.',1);
H('preischeck','Preis-Check','Die App zeigt einen Artikel nach dem anderen. Sie tippen Ihren Einkaufspreis ein oder bestätigen den Richtwert.',1);

/* Navigation und Rahmen */
H('nav_dash','Heute', NAV_DESC.dash);
H('nav_menu','Speisekarte', NAV_DESC.menu);
H('nav_cards','Rezepte', NAV_DESC.cards);
H('nav_vorb','Vorbereitung', NAV_DESC.vorb);
H('nav_ware','Ware', NAV_DESC.ware);
H('nav_team','Team & Zahlen', NAV_DESC.team);
H('nav_mehr','Mehr','Speisekarte, Ware, Team & Zahlen, Einstellungen und die Suche.');
H('nav_setup','Einstellungen', NAV_DESC.setup);
H('suche','Suchen','Tippen Sie ein Gericht, einen Artikel oder eine Aktion ein, zum Beispiel „Schwund“. Am Computer geht auch Strg und K.');
H('design','Hell oder dunkel','Schaltet die Farben um. Dunkel ist angenehm in einer dunklen Küche.');
H('whoami','Wer arbeitet gerade?','Zeigt, wer angemeldet ist. Das Team sieht alles, hakt ab, nimmt Ware an und bucht Schwund. Alles andere ändert der Chef.');
H('hilfe_schalter','Was ist das?','Der Hilfe-Schalter. Solange er an ist, erklärt die App alles, worauf Sie tippen. Es wird dabei nichts geändert.');
H('hier','So geht’s hier','Drei, vier Sätze dazu, wie diese Seite geht.');
H('zurueck','Zurück','Bringt Sie eine Ebene zurück zur Liste.');

/* Listen: Werkzeuge */
H('sortieren','Sortieren','Ein Tipp sortiert die Liste nach dieser Spalte. Noch ein Tipp dreht die Reihenfolge um.');
H('f_ueber','Über Ziel','Zeigt nur Gerichte, bei denen die Zutaten zu viel vom Preis fressen.');
H('f_ohne_rez','Ohne Rezeptur','Zeigt Gerichte, bei denen die App noch nicht weiß, was hineinkommt. Sie kann darum keinen Wareneinsatz rechnen.');
H('f_ohne_alg','Ohne Allergene','Zeigt Gerichte, bei denen die Allergene fehlen. In Österreich müssen sie auf der Karte stehen.');
H('f_ohne_foto','Ohne Foto','Zeigt Gerichte ohne Bild.');
H('f_kategorie','Kategorie wählen','Zeigt nur eine Kategorie oder nur eine Saison.');
H('preisfeld','Preisfeld','Der Verkaufspreis mit Steuer. Tippen Sie hinein, schreiben Sie den neuen Preis und drücken Sie Enter.');
H('status','Status','Zeigt, was bei diesem Gericht noch fehlt: Rezeptur oder Allergene. Der Stern heißt Empfehlung des Hauses.');
H('reiter_menu','Reiter der Speisekarte','Gerichte ist die Liste zum Rechnen und Ordnen. Gästekarte macht die Karte für die Gäste. Saison & Aktionen plant das Jahr.');

/* Speisekarte */
H('neu_gericht','Neues Gericht','Legt ein neues Gericht auf der Speisekarte an: Name, Preis, Kategorie.');
H('gericht_bearbeiten','Gericht bearbeiten','Name, Beschreibung, Preis, Saison und Allergene dieses Gerichts ändern.');
H('gericht_foto','Foto','Ein Foto für dieses Gericht aufnehmen oder aussuchen.');
H('pdf','Als PDF speichern','Macht aus der Gästekarte eine Datei. Die können Sie drucken oder verschicken.');
H('drucken','Drucken','Schickt die Seite an den Drucker.');
H('gdate','Datum der Karte','Die Karte zeigt, was an diesem Tag gilt: Saison, Wochentag und Aktionen.');
H('gstil','Vorlage','Sechs fertige Gestaltungen für die Gästekarte. Ein Tipp genügt, danach lässt sich alles verschieben. Jede Vorlage merkt sich Ihre Anordnung.');
H('geffekt','Effekte','Hintergrund, Akzentfarbe, Ornament und Schrift. Ein Tipp ändert die ganze Karte.');
H('gbaustein','Baustein','Die Karte besteht aus Bausteinen. Antippen wählt einen aus. Am Griff ziehen verschiebt ihn, mit Alt und den Pfeiltasten geht es auch.');
H('ausblenden','Ausblenden','Das Gericht bleibt in der App, steht aber nicht auf der Gästekarte.');
H('reihenfolge','Reihenfolge','Am Griff ziehen: Das Gericht wandert in seiner Kategorie nach oben oder unten. So steht es dann auch auf der Gästekarte.');

/* Rezepturen */
H('neu_rezept','Neue Rezeptur','Legt eine leere Rezeptur für ein Gericht an. Danach kommen die Zutaten auf den Teller.');
H('neu_basis','Neues Basisrezept','Für alles, was Sie vorkochen: Fond, Teig, Dressing.');
H('r_typ','Gerichte oder Basisrezepte','Gerichte gehen an den Gast. Basisrezepte kochen Sie vor und verwenden sie in Gerichten.');
H('zutat_plus','Zutat dazu','Öffnet die Liste aller Artikel und Basisrezepte. Ein Tipp legt die Zutat auf den Teller.');
H('zutat_weg','Vom Teller nehmen','Nimmt diese Zutat aus der Rezeptur. Sie können es gleich danach rückgängig machen.');
H('menge','Menge','Wie viel von dieser Zutat in eine Portion kommt. Zahl eintippen und Enter drücken.');
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
H('inv_voll','Volle Flaschen','Zählen Sie die vollen Flaschen oder Fässer. Die angebrochene tippen Sie daneben in Zehnteln an.');
H('inv_offen','Angebrochen','Wie voll ist die offene Flasche oder das Fass im Anstich? 0,3 heißt: knapp ein Drittel ist noch drin. Noch einmal tippen nimmt die Angabe zurück.');
H('schankrezeptur','Schankrezeptur','Was in ein Glas kommt: Artikel und Menge in cl, ml oder Liter. Daraus rechnet die App, was das Getränk kostet.',1);
H('schankverlust','Schankverlust','Was beim Zapfen und Einschenken verloren geht: Schaum, Reste im Fass, Kostproben. Sie tragen den Anteil beim Artikel ein, zum Beispiel 5 % bei Fassbier. Die App rechnet ihn in jedes Glas ein.',1);
H('ausschankmenge','Ausschankmenge','Wie viel ins Glas kommt, zum Beispiel 0,5 l. Die Menge steht auf der Gästekarte beim Preis.',1);
H('groesse','Weitere Größe','Dasselbe Getränk in einer anderen Menge, zum Beispiel 0,3 l. Sie tragen nur Menge und Preis ein, die Kosten rechnet die App aus derselben Schankrezeptur.');
H('dk_artikel','Artikel im Ausschank','Fügt eine Zeile hinzu: ein Artikel und die Menge, die ins Glas kommt.');
H('pfand','Pfand','Geld für Flasche, Kiste oder Fass, das Sie mit dem Leergut zurückbekommen. Es zählt nie zum Wareneinsatz.',1);
H('leergut','Leergut zurückgeben','Tragen Sie ein, wie viele Kisten oder Fässer zurückgehen. Die App zieht das Pfand vom offenen Betrag bei diesem Lieferanten ab.');
H('leergut_stand','Pfand beim Lieferanten','So viel Pfand haben Sie bezahlt und noch nicht zurückbekommen. Beim Wareneingang kommt das Pfand dazu, bei der Rückgabe geht es weg.');
H('neu_schank','Neue Schankrezeptur','Legt ein Getränk an: Bier vom Fass, ein Achtel Wein, ein Spritzer, ein Cocktail.');
H('f_getraenke','Getränke','Zeigt nur die Getränke: in den Rezepten die Schankrezepturen, bei den Preisen die Artikel mit Flasche, Fass oder Kiste.');

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

/* Artikel */
H('prod_neu','Neuer Artikel','Legt eine neue Zutat an: Name, Einheit, Einkaufspreis, Lieferant.');
H('prod_preis','Einkaufspreis','Was Sie dem Lieferanten zahlen, ohne Steuer, je kg, Liter oder Stück. Bei Getränken je Flasche, Fass oder Kiste, wie es auf der Rechnung steht. Eintippen und Enter drücken.');
H('prod_ok','Richtwert bestätigen','Der Richtwert stimmt ungefähr? Dann bestätigen. Er gilt ab jetzt als Ihr Preis.');
H('prod_alle_ok','Alle bestätigen','Bestätigt alle Richtwerte, die gerade in der Liste stehen. Nur tippen, wenn Sie die Preise angesehen haben.');
H('prod_import','Preisliste importieren','Lädt eine Preisliste vom Lieferanten als Datei. Die App zeigt vorher, was sich ändert.');
H('pc_start','Preis-Check starten','Die App zeigt einen Artikel nach dem anderen. Sie tippen Ihren Preis ein. Enter geht weiter.');
H('pc_ok','Richtwert stimmt','Der gezeigte Preis passt. Er wird als Ihr Preis übernommen.');
H('pc_skip','Überspringen','Diesen Artikel jetzt nicht. Er kommt beim nächsten Preis-Check wieder.');
H('pc_feld','Ihr Einkaufspreis','Netto, wie auf der Rechnung. Leer lassen, wenn der Richtwert stimmt.');
H('prod_stand','Stand','Zeigt, ob der Preis noch ein Richtwert ist oder wann Sie ihn zuletzt bestätigt haben.');

/* Auswertung */
H('rp_zeitraum','Zeitraum','Woche, Monat, Saison, Jahr oder ein eigener Zeitraum. Die Pfeile gehen einen Schritt zurück oder vor.');
H('rp_vergleich','Vergleich','Stellt die Zahlen neben den Zeitraum davor oder neben dasselbe im Vorjahr.');
H('rp_datei','Kassendatei wählen','Wählen Sie die Datei, die Ihre Kasse ausgibt. Die App zeigt zuerst eine Vorschau.');
H('rp_beispiel','Beispiel einfügen','Füllt das Feld mit erfundenen Zeilen. So sehen Sie, wie eine Kassendatei aussehen soll.');
H('rp_pruefen','Prüfen','Liest die Datei und zeigt, was importiert würde. Noch wird nichts gespeichert.');
H('rp_csv','Als CSV speichern','Speichert die Zahlen als Datei für Excel oder den Steuerberater.');
H('rp_bericht','Auswertung als PDF oder gedruckt','Der Bericht mit denselben Zahlen wie am Bildschirm, zum Aufheben oder Weitergeben.');
H('rp_delta','Δ Menge','Wie viele Portionen mehr oder weniger als im Vergleichszeitraum.');
H('rp_anteil','Anteil','Wie viel Prozent aller verkauften Portionen auf dieses Gericht fallen.');

/* Einstellungen */
H('s_sicherung','Sicherung erstellen','Speichert alle Daten als Datei. Am besten einmal pro Woche.');
H('s_laden','Sicherung laden','Holt Daten aus einer Sicherungsdatei zurück. Die jetzigen Daten werden dabei ersetzt.');
H('s_reset','Beispieldaten wiederherstellen','Ersetzt alles durch die Beispieldaten. Ihre eigenen Eingaben sind danach weg.');
H('s_rolle','Rolle wechseln','Stellt um, wer gerade arbeitet. Das Team sieht alles, hakt ab, bereitet Bestellungen vor, nimmt Ware an, bucht Schwund und zählt bei der Inventur mit. Alles andere ändert der Chef.');
H('station','Einrichtung','Sechs Schritte zeigen, wie viel von Ihrem Betrieb schon in der App steht. Die App rechnet das aus Ihren Daten.');
H('schwund_wert','Schwund','Was im Zeitraum als Schwund gebucht wurde, je Artikel in Euro zum Einkaufspreis.');
H('grundzutat','Kleinmengen','Salz, Gewürze, Öl und alles, wovon der Tag nur ein paar Gramm braucht. Auf der Vorbereitungsliste stehen sie erst, wenn Sie „alle Zutaten zeigen“ tippen.');
H('mehr_opt','Mehr Optionen','Selten Gebrauchtes steht hier: sortieren, weitere Spalten, CSV, Vergleich.');

/* Wo welche Erklärung hängt: [Selektor, Schlüssel]. Der erste Treffer zählt. */
const HELP_SEL = [
  ['.nav-i[data-tab="dash"]','nav_dash'],['.nav-i[data-tab="vorb"]','nav_vorb'],['.nav-i[data-tab="checkl"]','nav_checkl'],['.nav-i[data-tab="menu"]','nav_menu'],['.nav-i[data-tab="cards"]','nav_cards'],
  ['.nav-i[data-tab="ware"]','nav_ware'],['.nav-i[data-tab="team"]','nav_team'],['.nav-i[data-tab="setup"]','nav_setup'],['.nav-i[data-act="mehr"]','nav_mehr'],
  ['[data-act="palette"]','suche'],['[data-act="theme"]','design'],['#whoami','whoami'],['[data-act="helpMode"]','hilfe_schalter'],['[data-act="guideHere"]','hier'],['#app .back','zurueck'],
  ['#app details.more > summary','mehr_opt'],['#app table.lt thead th button[data-act="lsort"]','sortieren'],['#app .au-row','station'],['#app .rp-waste','schwund_wert'],['#app [data-act="plAllIng"]','grundzutat'],
  ['[data-act="sec"][data-id="over"],[data-act="goMenu"][data-id="over"]','f_ueber'],['[data-act="sec"][data-id="none"],[data-act="goMenu"][data-id="none"]','f_ohne_rez'],['[data-act="sec"][data-id="noalg"],[data-act="goMenu"][data-id="noalg"]','f_ohne_alg'],['[data-act="sec"][data-id="nophoto"]','f_ohne_foto'],['#app .sel-cat','f_kategorie'],
  ['#app input[data-mp]','preisfeld'],['#app .lt-st','status'],['#app [data-act="mtab"]','reiter_menu'],
  ['#app [data-act="newMenu"]','neu_gericht'],['#app button[data-act="editMenu"]','gericht_bearbeiten'],['#app [data-act="photoMenu"]','gericht_foto'],['#app [data-pdf]','pdf'],['#app [data-act="printMenu"],#app [data-act="printCard"],#app [data-act="ordPrint"]','drucken'],
  ['#gdate,#app [data-act="gdate"]','gdate'],['#app [data-gs="look"]','gstil'],['#app [data-gs="fx"],#app label.tog:has([data-gst])','geffekt'],['#gsCanvas .gs-b,#app [data-gs="add"]','gbaustein'],['#app [data-act="itemHide"]','ausblenden'],['#app .lt-grip','reihenfolge'],['#app [data-act="gseason"],#app [data-act="editSeason"]','saison'],['#app [data-act="newSpecial"],#app [data-act="editSpecial"]','aktion'],
  ['#app [data-act="newCard"][data-id="dish"]','neu_rezept'],['#app [data-act="newCard"][data-id="semi"]','neu_basis'],['#app [data-act="ctype"]','r_typ'],['#app [data-act="tellerPick"]','zutat_plus'],['#app [data-act="delLine"]','zutat_weg'],
  ['#app input[data-lf="qty"]','menge'],['#app [data-act="stepAdd"],#app textarea[data-step]','schritt'],['#cf-yieldG','portionsgewicht'],['#app [data-act="photoCard"]','rez_foto'],['#app [data-act="dupCard"]','duplizieren'],['#app [data-act="delCard"]','rez_loeschen'],['#app [data-act="toMenu"]','auf_karte'],
  ['#app .plate','teller'],['#sim','preissim'],['#portions','produktionsmenge'],['#app [data-act="pcFor"]','preischeck'],
  ['#app [data-act="moveDlg"][data-id^="in"],#app [data-act="ordRecv"]','b_wareneingang'],['#app [data-act="moveDlg"][data-id^="out"]','b_entnahme'],['#app [data-act="moveDlg"][data-id^="waste"]','b_schwund'],['#app [data-act="sales"]','b_verkauf'],
  ['#app .lvl,#app .level','fuellstand'],['#app [data-act="moveUndo"]','storno'],['#app [data-act="invStart"]','inv_start'],['#app [data-act="invFinish"]','inv_fertig'],['#app [data-act="invCancel"]','inv_weg'],['#app input[data-inv]','inv_feld'],['#app [data-act="loc"]','lagerort'],
  ['#app [data-act="buyNew"]','best_neu'],['#app [data-act="ordNew"]','best_vorbereiten'],['#app [data-act="ordRe"]','best_wie_zuletzt'],['#app [data-act="olSuggest"]','best_vorschlag'],['#app [data-act="ordMarkSent"]','best_gesendet'],['#app [data-act="ordOpened"]','best_kanal'],['#app [data-act="ordDel"]','best_loeschen'],['#app input[data-ol]','best_menge'],['#app [data-act="supEdit"]','lief_neu'],
  ['#app [data-act="rAll"]','r_alles'],['#app input[data-rp]','r_preis'],['#app [data-act="rBook"]','r_buchen'],['#rTemp','r_temp'],['#app select[data-rs]','r_status'],['#rNo','lieferschein'],
  ['#app [data-act="newProd"]','prod_neu'],['#app input[data-pp]','prod_preis'],['#app [data-act="pConfirm"]','prod_ok'],['#app [data-act="pConfirmAll"]','prod_alle_ok'],['#app [data-act="plImport"]','prod_import'],['#app [data-act="pcStart"]','pc_start'],['#app [data-act="pcOk"]','pc_ok'],['#app [data-act="pcSkip"]','pc_skip'],['#pcIn','pc_feld'],['#app [data-act="pFilter"][data-id="demo"]','richtwert'],
  ['#app .rp-period [data-act="rpUnit"],#app [data-act="rpStep"]','rp_zeitraum'],['#app [data-act="rpCmp"]','rp_vergleich'],['#app [data-act="rpFile"]','rp_datei'],['#app [data-act="rpSample"]','rp_beispiel'],['#app [data-act="rpAnalyse"]','rp_pruefen'],['#app [data-act="rpCsv"]','rp_csv'],['#app [data-act="rpPrint"]','rp_bericht'],['#app [data-act="rpTab"][data-id="import"]','kassendatei'],['#app [data-act="rpTab"][data-id="map"]','zuordnung'],
  ['#app input[data-invf]','inv_voll'],['#app .inv-t','inv_offen'],['#app [data-act="newCard"][data-id="drink"]','neu_schank'],['#app [data-act="ctype"][data-id="drink"],#app [data-act="pFilter"][data-id="drink"]','f_getraenke'],['#app [data-act="drinkLine"]','dk_artikel'],['#app [data-act="drinkSize"]','groesse'],['#dk-y','ausschankmenge'],['#app input[data-dq]','schankrezeptur'],['#app .dk-loss','schankverlust'],['#app [data-act="lgReturn"]','leergut'],['#app .lg-v','leergut_stand'],['#app .pf-row','pfand'],
  ['#app [data-act="export"]','s_sicherung'],['#app [data-act="importPick"]','s_laden'],['#app [data-act="reset"]','s_reset'],['#app [data-act="userSwitch"]','s_rolle'],['#s-target','ziel_we'],['#s-vat','mwst'],
];
/* Tabellenköpfe und Kennzahlen: nach ihrem Text */
const HELP_TXT = {
  'we':'wareneinsatz','wareneinsatz':'wareneinsatz','ø wareneinsatz':'we_pct','we %':'we_pct','we gesamt':'wareneinsatz','wareneinsatz pro portion':'wareneinsatz','wareneinsatz je gericht':'we_pct',
  'rohertrag':'rohertrag','rohertrag exkl. mwst.':'rohertrag','größter rohertrag':'rohertrag','aufschlagsfaktor':'aufschlag','putzverlust':'putzverlust','garverlust':'garverlust',
  'mindest':'mindestbestand','unter mindestbestand':'mindestbestand','lagerwert':'lagerwert','lagerort':'lagerort','füllstand':'fuellstand','soll':'soll_ist','ist gezählt':'soll_ist','differenz':'differenz','differenz letzte inventur':'differenz',
  'saison':'saison','allergene':'allergene','preis €':'prod_preis','stand':'prod_stand','= einheit':'gebinde','gebinde':'gebinde','ausschank':'schankrezeptur','leergut':'leergut_stand','pfand':'pfand','annahmeschluss':'annahmeschluss','mindestbestellwert':'mindestbestellwert',
  'umsatz netto':'umsatz','umsatz brutto':'mwst','portionen':'portionen','anteil':'rp_anteil','δ menge':'rp_delta','kostenstruktur':'kostenstruktur','preis-simulator':'preissim','produktionsmenge':'produktionsmenge',
  'in %':'we_pct','heute noch bestellen':'annahmeschluss','kalkuliert':'rezeptur','preis lt. rechnung':'r_preis','geliefert':'wareneingang','pro 100 g':'wareneinsatz','richtwert':'richtwert','zubereitung':'schritt','typ':'r_typ','kategorie':'kategorie',
};

/* ---------- Helfer für Rundgang und Hilfe ---------- */
const gq = s => { for(const el of document.querySelectorAll(s)){ const r = el.getBoundingClientRect(); if(r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el; } return null; };
const gNav = k => () => gq(`.side .nav-i[data-tab="${k}"]`) || gq(`.bottom .nav-i[data-tab="${k}"]`) || gq('.bottom .nav-i[data-act="mehr"]');
const gPhoneMore = k => !gq(`.side .nav-i[data-tab="${k}"]`) && !gq(`.bottom .nav-i[data-tab="${k}"]`) ? ' Am Handy steht das unter „Mehr“.' : '';

/* ---------- Der kurze Rundgang: die Seiten für jeden Tag ---------- */
const RUNDGANG = [
  {t:'Heute', go:() => go('dash'), sel:gNav('dash'), x:'Ihr Tagesblatt. Hier steht, was heute zu bestellen ist, welche Lieferung kommt und welche Checkliste offen ist. Schauen Sie jeden Morgen kurz hinein.'},
  {t:'Vorbereitung', go:() => go('vorb'), sel:gNav('vorb'), x:'Die Vorbereitungsliste: was heute vorzukochen und herzurichten ist. Die App rechnet sie aus den Verkäufen der letzten Wochen. Ein Tipp hakt ab.'},
  {t:'Checklisten', go:() => go('checkl'), sel:gNav('checkl'), x:'Aufsperren, Zusperren, Putzen: Listen zum Abhaken. Die App merkt sich, wer was wann erledigt hat.'},
  {t:'Ware', go:() => { view.stab = 'bestellung'; view.order = null; view.recv = null; go('buy'); }, sel:gNav('ware'), x:() => 'Bestand, Bestellen, Lieferanten, Preise und Inventur. Unter „Bestellen“ schlägt die App vor, was fehlt, und dort buchen Sie auch die Lieferung ein.' + gPhoneMore('ware')},
  {t:'Suche', sel:['.side [data-act="palette"]', '.topbar [data-act="palette"]'], x:'Sie finden etwas nicht? Tippen Sie hier ein Gericht, einen Artikel oder eine Seite ein. Alles Weitere erklärt „Was ist das?“: einschalten und auf etwas tippen.'},
];

/* ---------- „So geht’s hier“: drei, vier Sätze je Seite ---------- */
const HOWTO = {
  dash:['Oben steht, was heute zu tun ist: Vorbereitung, Bestellen bis wann, Eigenkontrolle, Lieferungen.', 'Ein Tipp auf eine Zeile führt direkt hin. „Öl gewechselt“ trägt den Ölwechsel gleich ein.', 'Ganz unten, eingeklappt: was bei der Einrichtung noch fehlt.'],
  vorb:['Oben wählen Sie den Tag: heute, morgen oder später in der Woche.', 'Die Vorbereitungsliste zeigt, was vorzukochen und herzurichten ist. Ein Tipp hakt ab.', 'Die Prognose darunter können Sie überschreiben, zum Beispiel bei einer Reservierung.', 'Fehlt Ware, legen Sie sie mit einem Tipp in die Bestellung.'],
  checkl:['Jeden Tag gibt es frische Listen. Tippen Sie auf eine Liste und dann auf jeden erledigten Punkt.', 'Manche Punkte brauchen eine Zahl, zum Beispiel die Temperatur im Kühlhaus.', 'Darunter steht die Eigenkontrolle: Reinigungsplan, Frittieröl, Temperatur der Lieferungen.', 'Im Verlauf sehen Sie die letzten 14 Tage und speichern die Monatsmappe als PDF.'],
  menu:['Eine Zeile je Gericht: Preis, Wareneinsatz und was übrig bleibt.', 'Den Preis ändern Sie direkt in der Zeile.', 'Am Griff links ziehen Sie ein Gericht an eine andere Stelle seiner Kategorie.', '„Ohne Rezeptur“ und „Allergene offen“ zeigen, wo noch etwas fehlt.'],
  guest:['So sehen die Gäste die Karte. Es zählt der gewählte Tag: Saison, Wochentag, Aktionen.', 'Vorlage und Effekte wählen Sie mit einem Tipp. Bausteine am Blatt antippen und am Griff verschieben.', '„Als PDF speichern“ macht eine Datei zum Drucken oder Verschicken.'],
  plan:['Die vier Balken sind Ihre Saisonen. Ein Tipp ändert, von wann bis wann eine gilt.', 'Eine Aktion ist eine eigene kleine Karte für ein paar Tage, zum Beispiel Wildwochen.', 'Welches Gericht in welcher Saison gilt, stellen Sie beim Gericht ein.'],
  cards:['Gerichte gehen an den Gast. Basisrezepte kochen Sie vor: Fond, Teig, Dressing.', 'Ein Tipp auf eine Zeile öffnet die Rezeptur.', '„+ Rezeptur“ legt eine neue an.'],
  card:['In der Mitte des Tellers steht, was eine Portion kostet. Jedes Stück im Ring ist eine Zutat.', 'Die Menge je Zutat ändern Sie direkt im Feld. „+ Zutat“ legt eine neue auf den Teller.', 'Unter „Zubereitung“ schreiben Sie Schritt für Schritt auf, wie es gemacht wird.', 'Der Preis-Simulator zeigt, was bei einem anderen Preis übrig bleibt. Erst „Übernehmen“ ändert den Preis.'],
  stock:['Eine Zeile je Artikel: was da ist und was es wert ist.', 'Plus und Minus in der Zeile buchen eine Lieferung oder eine Entnahme für diesen Artikel.', '„Schwund buchen“ schreibt auf, was verdorben oder verkocht ist, mit Grund.'],
  moves:['Jede Zeile ist eine Buchung: Lieferung, Entnahme, Schwund, Verkauf.', 'Vertippt? Der Pfeil nimmt eine Buchung zurück.'],
  inventur:['Inventur heißt: alles zählen. Sie können unterbrechen und später weitermachen.', 'Tippen Sie je Artikel die gezählte Menge ein. Die App zeigt den Unterschied.', 'Am Ende „Abschließen“: Der Bestand wird auf Ihre gezählten Mengen gesetzt.'],
  buy:['Oben stehen die Lieferanten, die heute Bestellungen annehmen, und bis wann.', '„Vorbereiten“ legt einen Entwurf an und schlägt vor, was fehlt. Gesendet wird erst, wenn Sie es sagen.', 'Ist die Ware da: Bestellung öffnen und „Wareneingang“ tippen.'],
  suppliers:['Je Lieferant: Kontakt, Bestelltage, Liefertage und Annahmeschluss.', 'Daraus weiß die App, wann Sie bestellen müssen.'],
  order:['Die Mengen sind in Gebinden. Die App hat vorgeschlagen, was unter dem Mindestbestand liegt.', 'E-Mail oder WhatsApp öffnet den fertigen Bestelltext. Abschicken müssen Sie selbst.', '„Als gesendet markieren“ erst tippen, wenn die Bestellung wirklich draußen ist.'],
  recv:['Links steht, was bestellt war. Sie tragen ein, was wirklich gekommen ist.', 'Stimmt alles, reicht „Alles wie bestellt“.', 'Steht auf der Rechnung ein anderer Preis, tragen Sie ihn ein. Die App merkt ihn sich.', '„Einbuchen“ bringt die Ware ins Lager.'],
  products:['Eine Zeile je Artikel. Wichtig ist der Preis: was Sie dem Lieferanten zahlen, ohne Steuer.', 'Den Preis ändern Sie direkt in der Zeile. Stimmt ein Richtwert ungefähr, reicht „Bestätigen“.', 'Schneller geht es mit „Preis-Check“: ein Artikel nach dem anderen.'],
  pcheck:['Oben steht der Lieferant, groß der Artikel, links der Richtwert.', 'Tippen Sie Ihren Preis ein, netto wie auf der Rechnung. Enter geht weiter.', 'Preis nicht zur Hand? Überspringen. „Beenden“ hört auf, alles bleibt gespeichert.'],
  dienst:['Jede Person hat eine Zeile, jeder Tag eine Spalte. Ein Tipp auf ein Feld trägt einen Dienst ein.', 'Ein Tipp auf einen Dienst öffnet ihn zum Ändern. Urlaub und Krank tragen Sie im selben Fenster ein.', '„Als PDF speichern“ macht eine Seite zum Aufhängen, „Text kopieren“ den Plan für WhatsApp.'],
  report:['Oben wählen Sie den Zeitraum. Die Pfeile gehen einen Schritt zurück oder vor.', 'Darunter: was eingenommen wurde, die Renner, die Ladenhüter und jedes Gericht einzeln.', '„Schwund“ zeigt, was im Zeitraum weggeworfen wurde, in Euro.', 'Die Zahlen kommen aus Ihrer Kasse: unter „Kasse importieren“ laden Sie die Datei.'],
  setup:['Oben: Name, Steuer und Ihr Ziel für den Wareneinsatz.', '„Sicherung erstellen“ speichert alle Daten als Datei. Machen Sie das einmal pro Woche.', 'Unter „Wer arbeitet gerade?“ stellen Sie zwischen Chef und Team um.'],
  daten:['Sechs Schritte von den Beispielen zu Ihren eigenen Daten, in dieser Reihenfolge.', 'Jeder Import zeigt zuerst eine Vorschau: neu, aktualisiert, unverändert oder Fehler. Erst „Übernehmen“ ändert etwas.', 'Nach jedem Import gibt es „Rückgängig“. Dann ist alles wie vorher.', 'Zu jedem Import gibt es eine Vorlage zum Ausfüllen, als CSV und als Excel.'],
  einr:['Sechs Schritte, bis Ihr Betrieb ganz in der App steht.', 'Der Knopf rechts bringt Sie an die Stelle, an der es weitergeht.', 'Der Stand rechnet sich aus Ihren Daten. Sie müssen nichts abhaken.'],
};
