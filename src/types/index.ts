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
    username: string;
    name: string;
    email: string;
    joinDate: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER';
};
