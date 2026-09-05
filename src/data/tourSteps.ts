export interface TourStep {
  id: string;
  /** data-tour value of the element to spotlight; null = centered card, no spotlight */
  target: string | null;
  title: string;
  body: string;
  placement?: 'right' | 'left' | 'bottom' | 'top';
  /** right panel tab this step needs active */
  tab?: 'sequence' | 'classes';
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Välkommen till WE Course Designer',
    body: 'Här bygger du banor för Working Equitation — placera hinder på en skalenlig arena, rita ridvägen, sätt kriterier per klass och skriv ut banskissen. Genomgången tar en halv minut.',
  },
  {
    id: 'arena',
    target: 'arena-size',
    title: 'Arenans mått',
    body: 'Ange arenans längd och bredd i meter. Allt på banan ritas skalenligt, så måtten här styr hur mycket plats du har. Om du inte aktivt väljer ett annat mått kommer 60x40 meter användas.',
    placement: 'right',
  },
  {
    id: 'palette',
    target: 'obstacle-palette',
    title: 'Hinderpaletten',
    body: 'Dra ett hinder från listan ut på arenan. Grupper som Två tunnor och Parallellslalom placerar flera delar samtidigt med rätt avstånd. Alla objekt har fasta mått, förutom Start/Mål och Markering - dra i deras sidomarkeringar för att justera storleken.',
    placement: 'right',
  },
  {
    id: 'canvas-place',
    target: 'canvas',
    title: 'Arenan',
    body: 'Släpp hindret här. Dra för att flytta, använd rotationshandtaget för att vrida och krysset/Delete för att ta bort. Inställningen Fäst till rutnät fäster hindren till rutnätet med intervall om 1 meter, rotationen fäster till 45 graders steg. Avaktivera Fäst till rutnät för att placera/rotera fritt.',
    placement: 'left',
  },
  {
    id: 'canvas-route',
    target: 'canvas',
    title: 'Ridvägen',
    body: 'Håll muspekaren över ett hinder så visas dess in- och utgångspunkter. Dra från en punkt för att lägga till ett passage-moment — ridvägen ritas automatiskt mellan momenten. Du kan flytta på en passage-pil eller dess sekvensnummer genom att trycka på dem och sedan trycka-och-dra. Tryck Delete för att radera en markerad passage. ',
    placement: 'left',
  },
  {
    id: 'sequence',
    target: 'sequence-panel',
    title: 'Sekvensen',
    body: 'Listan visar passager, inte hinder. Samma hinder kan alltså förekomma flera gånger, till exempel en passage som rids åt båda hållen. Dra för att ändra ordning och numrering.',
    placement: 'left',
    tab: 'sequence',
  },
  {
    id: 'classes',
    target: 'classes-tab',
    title: 'Klasser och kriterier',
    body: 'Under Klasser väljer du vilka hinder som ingår i varje klass och gren, och skriver eventuella noteringar. Varje klass får sin egen banskiss.',
    placement: 'left',
    tab: 'classes',
  },
  {
    id: 'event-meta',
    target: 'event-meta',
    title: 'Tävlingsuppgifter',
    body: 'Fyll i tävlingsplats, domare, banbyggare och datum. Uppgifterna hamnar i sidhuvudet på den utskrivna banskissen.',
    placement: 'left',
    tab: 'sequence',
  },
  {
    id: 'topbar',
    target: 'topbar-actions',
    title: 'Spara, öppna och skriv ut',
    body: 'Spara låter dig spara ner banan som en fil, Öppna läser in en tidigare sparad bana från en fil. Skriv ut ger dig en banskiss per klass. Du kan när som helst starta om den här genomgången med Introduktion.',
    placement: 'bottom',
  },
];
