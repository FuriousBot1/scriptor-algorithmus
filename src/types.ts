export type LinkItem = {
  url: string;
  title?: string;
};

export type ImageItem = {
  src: string;
  alt?: string;
};

export type Note = {
  id: string;
  section: string;
  text: string;
  done?: boolean;
  archived?: boolean;
  links?: LinkItem[];
  image?: ImageItem;
  created: number;
  updated: number;
};

export type Section = {
  id: string;
  title: string;
};

export type Page = {
  id: string;
  title: string;
  kind?: 'page' | 'archive';
  sections: Section[];
  notes: Note[];
};

export type StoreDoc = {
  updated: number;
  pages: Page[];
  activePageId: string;
};

export type ShareInboxItem = {
  title?: string;
  text?: string;
  url?: string;
  image?: string;
};
