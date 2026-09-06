// Le Refus — content list. Pure data, no logic. The page imports
// this and renders the editorial register.

export type Refusal = {
  id: string;
  title: { fr: string; en: string };
  why: { fr: string; en: string };
};

export const REFUSALS: Refusal[] = [
  {
    id: 'ticker',
    title: {
      fr: 'Le ticker temps réel',
      en: 'The real-time ticker',
    },
    why: {
      fr: 'Le prix qui clignote n’est pas une information : c’est une excitation. kNOWTrade n’existe pas pour entretenir la fébrilité ; il existe pour que la séance suivante soit meilleure que la précédente.',
      en: 'A blinking price is not information — it is stimulation. kNOWTrade does not exist to maintain agitation; it exists so the next session is better than the last.',
    },
  },
  {
    id: 'leverage-calculator',
    title: {
      fr: 'Le calculateur de levier 1:100, 1:500',
      en: 'The 1:100, 1:500 leverage calculator',
    },
    why: {
      fr: 'Multiplier la taille d’une position par cent ne multiplie pas la lucidité. Le Calculateur de survie fait l’arithmétique honnête ; le reste serait un encouragement déguisé.',
      en: 'Multiplying position size by a hundred does not multiply clarity. The Survival Calculator does the honest math; anything more would be an encouragement in disguise.',
    },
  },
  {
    id: 'copy-trading',
    title: {
      fr: 'Le copy-trading et les signaux automatiques',
      en: 'Copy-trading and automated signals',
    },
    why: {
      fr: 'Copier l’entrée d’un inconnu, ce n’est pas trader — c’est confier son compte à une silhouette. Apprendre à lire un graphique demande du temps ; kNOWTrade rachète ce temps en contenu, pas en raccourcis.',
      en: 'Copying a stranger’s entry is not trading — it is handing your account to a silhouette. Learning to read a chart takes time; kNOWTrade buys that time back with content, not shortcuts.',
    },
  },
  {
    id: 'telegram-vip',
    title: {
      fr: 'Le groupe Telegram VIP',
      en: 'The VIP Telegram group',
    },
    why: {
      fr: 'Une chambre privée où l’on hurle des entrées en majuscules : ce n’est pas une communauté, c’est une casse-tête vendu cher. Si kNOWTrade invite un jour des lecteurs à se parler, ce sera par lettres lues, pas par alertes hurlées.',
      en: 'A private room where entries are shouted in caps: that is not a community, it is an expensive headache. If kNOWTrade ever invites readers to talk to each other, it will be through letters read, not alerts screamed.',
    },
  },
  {
    id: 'guaranteed-backtest',
    title: {
      fr: 'Le backtest « garanti gagnant »',
      en: 'The “guaranteed-winning” backtest',
    },
    why: {
      fr: 'Aucun backtest ne garantit le marché de demain. kNOWTrade n’imprimera jamais de courbe d’equity ascendante pour vendre une méthode — la vraisemblance, c’est aussi de montrer les jours qui descendent.',
      en: 'No backtest guarantees tomorrow’s market. kNOWTrade will never print an upward equity curve to sell a method — credibility includes showing the days that go down.',
    },
  },
  {
    id: 'gain-testimonials',
    title: {
      fr: 'Les témoignages de gains',
      en: 'Profit testimonials',
    },
    why: {
      fr: 'Sept témoignages d’élèves devenus riches sont la preuve qu’on vend un rêve, pas un métier. kNOWTrade publie des leçons, des erreurs et des Lettres — pas des photos de Lamborghini.',
      en: 'Seven testimonials of students-turned-rich is proof you are selling a dream, not a craft. kNOWTrade publishes lessons, mistakes, and Letters — not photos of Lamborghinis.',
    },
  },
  {
    id: 'push-fomo',
    title: {
      fr: 'Les notifications push pour le FOMO',
      en: 'Push notifications for FOMO',
    },
    why: {
      fr: '« Le BTC vient de casser un palier » : ce n’est pas une nouvelle utile, c’est une laisse. kNOWTrade ne vous suivra pas hors du navigateur pour vous ramener — vous reviendrez quand le carnet appelle, pas quand un téléphone vibre.',
      en: '“BTC just broke a level”: that is not useful news, it is a leash. kNOWTrade will not follow you out of the browser to drag you back — you return when the register calls, not when a phone buzzes.',
    },
  },
  {
    id: 'gamified-badges',
    title: {
      fr: 'La gamification de badges et de niveaux marketing',
      en: 'Gamified badges and marketing levels',
    },
    why: {
      fr: 'Les badges « 7 jours de streak gagné » sont des bonbons qui flattent l’assiduité sans rien apprendre. La Cote est honnête ; elle baisse aussi. C’est la seule progression que kNOWTrade affichera.',
      en: 'Badges for “7-day streak earned” are candy that flatters consistency without teaching anything. The Score is honest; it also goes down. That is the only progress kNOWTrade will display.',
    },
  },
  {
    id: 'comeback-coupon',
    title: {
      fr: 'Les coupons de retour après une perte',
      en: 'Comeback coupons after a loss',
    },
    why: {
      fr: 'Offrir un mois gratuit à un trader qui vient de perdre, c’est l’inviter à perdre encore. kNOWTrade n’aura jamais de mécanique qui rentabilise vos mauvaises journées.',
      en: 'Offering a free month to a trader who just lost is inviting them to lose again. kNOWTrade will never run a mechanic that monetizes your bad days.',
    },
  },
  {
    id: 'paid-influencers',
    title: {
      fr: 'Les influenceurs sponsorisés',
      en: 'Paid influencer placements',
    },
    why: {
      fr: 'On ne paiera personne pour dire que kNOWTrade est bien. Si le métier l’est, des lecteurs en parleront — sans contrat, sans lien d’affiliation, sans code promo.',
      en: 'We will pay no one to say kNOWTrade is good. If the craft is good, readers will speak of it — without contracts, without affiliate links, without promo codes.',
    },
  },
];
