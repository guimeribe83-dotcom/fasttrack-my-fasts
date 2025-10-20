export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  number: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  id: string;
  name: string;
  abbr: string;
  testament: 'old' | 'new';
  chapters: BibleChapter[];
}

export const bibleBooks: BibleBook[] = [
  {
    id: 'genesis',
    name: 'Gênesis',
    abbr: 'Gn',
    testament: 'old',
    chapters: [
      {
        number: 1,
        verses: [
          { number: 1, text: 'No princípio, criou Deus os céus e a terra.' },
          { number: 2, text: 'A terra, porém, estava sem forma e vazia; havia trevas sobre a face do abismo, e o Espírito de Deus pairava por sobre as águas.' },
          { number: 3, text: 'Disse Deus: Haja luz; e houve luz.' },
          { number: 4, text: 'E viu Deus que a luz era boa; e fez separação entre a luz e as trevas.' },
          { number: 5, text: 'Chamou Deus à luz Dia e às trevas, Noite. Houve tarde e manhã, o primeiro dia.' },
          { number: 6, text: 'E disse Deus: Haja firmamento no meio das águas e separação entre águas e águas.' },
          { number: 7, text: 'Fez, pois, Deus o firmamento e separação entre as águas debaixo do firmamento e as águas sobre o firmamento. E assim se fez.' },
          { number: 8, text: 'E chamou Deus ao firmamento Céus. Houve tarde e manhã, o segundo dia.' },
          { number: 9, text: 'Disse também Deus: Ajuntem-se as águas debaixo dos céus num só lugar, e apareça a porção seca. E assim se fez.' },
          { number: 10, text: 'À porção seca chamou Deus Terra e ao ajuntamento das águas, Mares. E viu Deus que isso era bom.' },
          { number: 11, text: 'E disse: Produza a terra relva, ervas que deem semente e árvores frutíferas que deem fruto segundo a sua espécie, cuja semente esteja nele, sobre a terra. E assim se fez.' },
          { number: 12, text: 'A terra, pois, produziu relva, ervas que davam semente segundo a sua espécie e árvores que davam fruto, cuja semente estava nele, conforme a sua espécie. E viu Deus que isso era bom.' },
          { number: 13, text: 'Houve tarde e manhã, o terceiro dia.' },
          { number: 14, text: 'Disse também Deus: Haja luzeiros no firmamento dos céus, para fazerem separação entre o dia e a noite; e sejam eles para sinais, para estações, para dias e anos.' },
          { number: 15, text: 'E sejam para luzeiros no firmamento dos céus, para alumiar a terra. E assim se fez.' },
          { number: 16, text: 'Fez Deus os dois grandes luzeiros: o maior para governar o dia, e o menor para governar a noite; e fez também as estrelas.' },
          { number: 17, text: 'E os colocou no firmamento dos céus para alumiarem a terra,' },
          { number: 18, text: 'para governarem o dia e a noite e fazerem separação entre a luz e as trevas. E viu Deus que isso era bom.' },
          { number: 19, text: 'Houve tarde e manhã, o quarto dia.' },
          { number: 20, text: 'Disse também Deus: Povoem-se as águas de enxames de seres viventes; e voem as aves sobre a terra, sob o firmamento dos céus.' },
          { number: 21, text: 'Criou, pois, Deus os grandes animais marinhos e todos os seres viventes que rastejam, os quais povoavam as águas, segundo as suas espécies; e toda ave que voa, segundo a sua espécie. E viu Deus que isso era bom.' },
          { number: 22, text: 'E Deus os abençoou, dizendo: Sede fecundos, multiplicai-vos e enchei as águas dos mares; e, na terra, se multipliquem as aves.' },
          { number: 23, text: 'Houve tarde e manhã, o quinto dia.' },
          { number: 24, text: 'Disse também Deus: Produza a terra seres viventes, conforme a sua espécie: animais domésticos, répteis e animais selváticos, segundo a sua espécie. E assim se fez.' },
          { number: 25, text: 'E fez Deus os animais selváticos, segundo a sua espécie, e os animais domésticos, conforme a sua espécie, e todos os répteis da terra, conforme a sua espécie. E viu Deus que isso era bom.' },
          { number: 26, text: 'Também disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; tenha ele domínio sobre os peixes do mar, sobre as aves dos céus, sobre os animais domésticos, sobre toda a terra e sobre todos os répteis que rastejam pela terra.' },
          { number: 27, text: 'Criou Deus, pois, o homem à sua imagem, à imagem de Deus o criou; homem e mulher os criou.' },
          { number: 28, text: 'E Deus os abençoou e lhes disse: Sede fecundos, multiplicai-vos, enchei a terra e sujeitai-a; dominai sobre os peixes do mar, sobre as aves dos céus e sobre todo animal que rasteja pela terra.' },
          { number: 29, text: 'E disse Deus ainda: Eis que vos tenho dado todas as ervas que dão semente e se acham na superfície de toda a terra e todas as árvores em que há fruto que dê semente; isso vos será para mantimento.' },
          { number: 30, text: 'E a todos os animais da terra, e a todas as aves dos céus, e a todos os répteis da terra, em que há fôlego de vida, toda erva verde lhes será para mantimento. E assim se fez.' },
          { number: 31, text: 'Viu Deus tudo quanto fizera, e eis que era muito bom. Houve tarde e manhã, o sexto dia.' },
        ],
      },
    ],
  },
  {
    id: 'john',
    name: 'João',
    abbr: 'Jo',
    testament: 'new',
    chapters: [
      {
        number: 1,
        verses: [
          { number: 1, text: 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.' },
          { number: 2, text: 'Ele estava no princípio com Deus.' },
          { number: 3, text: 'Todas as coisas foram feitas por intermédio dele, e, sem ele, nada do que foi feito se fez.' },
          { number: 4, text: 'A vida estava nele e a vida era a luz dos homens.' },
          { number: 5, text: 'A luz resplandece nas trevas, e as trevas não prevaleceram contra ela.' },
          { number: 6, text: 'Houve um homem enviado por Deus cujo nome era João.' },
          { number: 7, text: 'Este veio como testemunha para que testificasse a respeito da luz, a fim de todos virem a crer por intermédio dele.' },
          { number: 8, text: 'Ele não era a luz, mas veio para que testificasse da luz,' },
          { number: 9, text: 'a saber, a verdadeira luz, que, vinda ao mundo, ilumina a todo homem.' },
          { number: 10, text: 'O Verbo estava no mundo, o mundo foi feito por intermédio dele, mas o mundo não o conheceu.' },
          { number: 11, text: 'Veio para o que era seu, e os seus não o receberam.' },
          { number: 12, text: 'Mas, a todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus, a saber, aos que crêem no seu nome;' },
          { number: 13, text: 'os quais não nasceram do sangue, nem da vontade da carne, nem da vontade do homem, mas de Deus.' },
          { number: 14, text: 'E o Verbo se fez carne e habitou entre nós, cheio de graça e de verdade, e vimos a sua glória, glória como do unigênito do Pai.' },
          { number: 15, text: 'João testemunha a respeito dele e exclama: Este é o de quem eu disse: o que vem depois de mim tem, contudo, a primazia, porquanto já existia antes de mim.' },
          { number: 16, text: 'Porque todos nós temos recebido da sua plenitude e graça sobre graça.' },
          { number: 17, text: 'Porque a lei foi dada por intermédio de Moisés; a graça e a verdade vieram por meio de Jesus Cristo.' },
          { number: 18, text: 'Ninguém jamais viu a Deus; o Deus unigênito, que está no seio do Pai, é quem o revelou.' },
        ],
      },
    ],
  },
  {
    id: 'philippians',
    name: 'Filipenses',
    abbr: 'Fp',
    testament: 'new',
    chapters: [
      {
        number: 1,
        verses: [
          { number: 1, text: 'Paulo e Timóteo, servos de Cristo Jesus, a todos os santos em Cristo Jesus, inclusive bispos e diáconos, que vivem em Filipos,' },
          { number: 2, text: 'graça e paz a vós outros, da parte de Deus, nosso Pai, e do Senhor Jesus Cristo.' },
          { number: 3, text: 'Dou graças ao meu Deus por tudo que recordo de vós,' },
          { number: 4, text: 'fazendo sempre, com alegria, súplicas por todos vós, em todas as minhas orações,' },
          { number: 5, text: 'pela vossa cooperação no evangelho, desde o primeiro dia até agora.' },
          { number: 6, text: 'Estou plenamente certo de que aquele que começou boa obra em vós há de completá-la até ao Dia de Cristo Jesus.' },
          { number: 7, text: 'Aliás, é justo que eu assim pense de todos vós, porque vos trago no coração, seja nas minhas algemas, seja na defesa e confirmação do evangelho, pois todos sois participantes da graça comigo.' },
          { number: 8, text: 'Pois minha testemunha é Deus, da saudade que tenho de todos vós, na terna misericórdia de Cristo Jesus.' },
          { number: 9, text: 'E a minha oração é esta: que o vosso amor aumente mais e mais em pleno conhecimento e toda a percepção,' },
          { number: 10, text: 'para aprovardes as coisas excelentes e serdes sinceros e inculpáveis para o Dia de Cristo,' },
          { number: 11, text: 'cheios do fruto de justiça, o qual é mediante Jesus Cristo, para a glória e louvor de Deus.' },
        ],
      },
    ],
  },
  {
    id: 'psalms',
    name: 'Salmos',
    abbr: 'Sl',
    testament: 'old',
    chapters: [
      {
        number: 23,
        verses: [
          { number: 1, text: 'O SENHOR é o meu pastor; nada me faltará.' },
          { number: 2, text: 'Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso;' },
          { number: 3, text: 'refrigera-me a alma. Guia-me pelas veredas da justiça por amor do seu nome.' },
          { number: 4, text: 'Ainda que eu ande pelo vale da sombra da morte, não temerei mal nenhum, porque tu estás comigo; o teu bordão e o teu cajado me consolam.' },
          { number: 5, text: 'Preparas-me uma mesa na presença dos meus adversários, unges a minha cabeça com óleo; o meu cálice transborda.' },
          { number: 6, text: 'Bondade e misericórdia certamente me seguirão todos os dias da minha vida; e habitarei na Casa do SENHOR para todo o sempre.' },
        ],
      },
    ],
  },
];

// Função para buscar um livro por ID
export const findBookById = (bookId: string): BibleBook | undefined => {
  return bibleBooks.find(book => book.id === bookId);
};

// Função para obter capítulo específico
export const getChapter = (bookId: string, chapterNumber: number): BibleChapter | undefined => {
  const book = findBookById(bookId);
  return book?.chapters.find(chapter => chapter.number === chapterNumber);
};

// Função para obter total de capítulos de um livro
export const getTotalChapters = (bookId: string): number => {
  const book = findBookById(bookId);
  return book?.chapters.length ?? 0;
};
