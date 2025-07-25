export type Author = {
  id: string;
  name: string;
};

export type Genre = {
  id: string;
  name: string;
};

export type Series = {
  id: string;
  name: string;
}

export type CoverImages = {
  size250: string;
  size360: string;
  size480: string;
};

export type YoutubeLink = {
  url: string;
  chapters?: string;
}

export type Book = {
  id:string;
  docId?: string; // Firestore document ID
  title: string;
  authorId: string;
  publicationDate: string;
  coverImages: CoverImages;
  shortDescription: string;
  longDescription: string;
  series: string | null;
  seriesOrder: number | null;
  genreIds: string[];
  youtubeLinks: YoutubeLink[];
  amazonLink: string;
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
  likes: string[];
  dislikes: string[];
  parentId: string | null;
};
