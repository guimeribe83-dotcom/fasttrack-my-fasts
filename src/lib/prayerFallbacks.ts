export interface PrayerData {
  title: string;
  introduction: string;
  prayer_text: string;
  scripture_reference: string;
  scripture_text: string;
  sections: Array<{
    type: string;
    title: string;
    content: string;
  }>;
  daily_affirmation: string;
}

export const fallbackPrayers: Record<string, PrayerData> = {
  healing: {
    title: "Oração de Cura e Restauração",
    introduction: "Uma oração para buscar a cura divina",
    prayer_text: "Pai Celestial, venho a Ti reconhecendo que és o Grande Médico. Confesso minha dependência total de Tua misericórdia e poder restaurador. Peço que toques em cada área que necessita de cura, trazendo renovação física, emocional e espiritual. Agradeço porque sei que Tua vontade é sempre perfeita e Teu amor nunca falha.",
    scripture_reference: "Jeremias 30:17",
    scripture_text: "Mas eu te restaurarei a saúde e curarei as tuas feridas, diz o SENHOR.",
    sections: [
      {
        type: "adoration",
        title: "Adoração",
        content: "Senhor, Tu és o Grande Médico, aquele que criou cada célula do meu corpo. Reconheço Teu poder infinito sobre toda enfermidade."
      },
      {
        type: "confession",
        title: "Confissão",
        content: "Confesso que sem Ti nada posso fazer. Reconheço minha total dependência de Tua graça e misericórdia restauradora."
      },
      {
        type: "supplication",
        title: "Súplica",
        content: "Peço que toques cada área que precisa de cura. Traz renovação completa - física, emocional e espiritual. Restaura-me segundo Tua perfeita vontade."
      },
      {
        type: "thanksgiving",
        title: "Gratidão",
        content: "Agradeço porque sei que estás agindo. Tua palavra não volta vazia e Tuas promessas são fiéis. Obrigado pela cura que já está em andamento."
      }
    ],
    daily_affirmation: "Deus está restaurando minha saúde hoje"
  },
  guidance: {
    title: "Oração por Direção Divina",
    introduction: "Buscando a sabedoria de Deus para decisões",
    prayer_text: "Senhor, Tu és a luz que ilumina meu caminho. Confesso que muitas vezes tento seguir meus próprios caminhos. Peço que me guies com Tua sabedoria infinita, mostrando claramente a direção que devo seguir. Agradeço porque prometes guiar aqueles que confiam em Ti.",
    scripture_reference: "Provérbios 3:5-6",
    scripture_text: "Confia no SENHOR de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
    sections: [
      {
        type: "adoration",
        title: "Adoração",
        content: "Senhor, Tu és onisciente e conheces o fim desde o princípio. Tua sabedoria é infinitamente superior à minha compreensão limitada."
      },
      {
        type: "confession",
        title: "Confissão",
        content: "Confesso que muitas vezes confio em minha própria sabedoria. Reconheço que preciso de Tua orientação em cada passo do meu caminho."
      },
      {
        type: "supplication",
        title: "Súplica",
        content: "Peço que ilumine meu caminho com Tua sabedoria. Mostra-me claramente qual direção seguir. Fecha as portas erradas e abre as certas."
      },
      {
        type: "thanksgiving",
        title: "Gratidão",
        content: "Agradeço porque prometes guiar aqueles que Te buscam. Tua direção é perfeita e Teus caminhos são sempre os melhores para mim."
      }
    ],
    daily_affirmation: "Deus está guiando meus passos hoje"
  },
  gratitude: {
    title: "Oração de Gratidão e Louvor",
    introduction: "Expressando gratidão pelas bênçãos divinas",
    prayer_text: "Pai Celestial, meu coração transborda de gratidão. Confesso que nem sempre reconheço Tuas inúmeras bênçãos. Peço que abras meus olhos para ver Tua bondade em cada detalhe da vida. Agradeço por Teu amor incondicional, Tua fidelidade constante e Tuas misericórdias que se renovam a cada manhã.",
    scripture_reference: "1 Tessalonicenses 5:18",
    scripture_text: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.",
    sections: [
      {
        type: "adoration",
        title: "Adoração",
        content: "Senhor, Tu és bom e Tua misericórdia dura para sempre. Cada respiração é um presente Teu. Tu és digno de todo louvor."
      },
      {
        type: "confession",
        title: "Confissão",
        content: "Confesso que muitas vezes foco no que falta e esqueço de agradecer pelo que tenho. Perdoa minha ingratidão e transforma meu coração."
      },
      {
        type: "supplication",
        title: "Súplica",
        content: "Peço que me ensines a viver em constante gratidão. Abre meus olhos para ver Tua bondade em tudo, mesmo nas dificuldades."
      },
      {
        type: "thanksgiving",
        title: "Gratidão",
        content: "Agradeço por Tua presença constante, por Teu amor que nunca falha, por Tua provisão diária e por cada bênção que recebi."
      }
    ],
    daily_affirmation: "Hoje escolho ser grato em tudo"
  },
  other: {
    title: "Oração de Consagração",
    introduction: "Dedicando este jejum ao Senhor",
    prayer_text: "Pai Amado, venho a Ti com um coração aberto. Confesso que preciso de Ti em cada área da minha vida. Peço que uses este tempo de jejum para me transformar e me aproximar de Ti. Agradeço pela oportunidade de buscar Tua face de maneira especial.",
    scripture_reference: "Filipenses 4:6-7",
    scripture_text: "Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e súplica com ações de graças.",
    sections: [
      {
        type: "adoration",
        title: "Adoração",
        content: "Senhor, Tu és digno de toda honra e louvor. Reconheço Tua soberania sobre minha vida e me submeto à Tua vontade perfeita."
      },
      {
        type: "confession",
        title: "Confissão",
        content: "Confesso que muitas vezes vivo distante de Ti. Reconheço minha necessidade constante de Tua presença e direção em minha vida."
      },
      {
        type: "supplication",
        title: "Súplica",
        content: "Peço que uses este jejum para me moldar segundo Teu coração. Transforma-me, renova-me e aproxima-me de Ti de maneira profunda."
      },
      {
        type: "thanksgiving",
        title: "Gratidão",
        content: "Agradeço porque sei que ouves minhas orações. Tu és fiel e Tuas promessas são verdadeiras. Obrigado por este tempo especial contigo."
      }
    ],
    daily_affirmation: "Hoje busco a presença de Deus"
  }
};

export const getFallbackPrayerByCategory = (category: string): PrayerData => {
  return fallbackPrayers[category] || fallbackPrayers.other;
};
