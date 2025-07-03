export type Book = {
  id: string;
  title: string;
  author: string;
  publicationDate: string;
  coverImage: string;
  summary: string;
  series: string | null;
  genre: string;
  youtubeLink: string;
};

export type User = {
    id: string;
    name: string;
    email: string;
    joinDate: string;
};
