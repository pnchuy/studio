export type Author = {
  id: string;
  name: string;
};

export type Genre = {
  id: string;
  name: string;
};

export type Book = {
  id: string;
  title: string;
  authorId: string;
  publicationDate: string;
  coverImage: string;
  summary: string;
  series: string | null;
  genreIds: string[];
  youtubeLink: string;
};

export type BookWithDetails = Book & {
  author: Author | undefined;
  genres: Genre[];
}

export type User = {
    id: string;
    username: string;
    name: string;
    email: string;
    joinDate: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER';
};

export type Comment = {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string; // ISO String
  editedAt?: string; // ISO String
};
