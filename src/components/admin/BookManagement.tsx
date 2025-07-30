
"use client";

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Book, Author, Genre, Series } from '@/types';
import { getPaginatedBooksWithDetails } from '@/lib/books';
import { getAllAuthors as fetchAllAuthors } from '@/lib/authors';
import { getAllGenres as fetchAllGenres } from '@/lib/genres';
import { getAllSeries as fetchAllSeries } from '@/lib/series';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Upload, Eye, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddBookForm } from './AddBookForm';
import { EditBookForm } from './EditBookForm';
import { AuthorManagement } from './AuthorManagement';
import { GenreManagement } from './GenreManagement';
import { SeriesManagement } from './SeriesManagement';
import { ImportBooksDialog, type ImportBook } from './ImportBooksDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateId, slugify } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';


export function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [series, setSeries] = useState<Series[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isEditBookOpen, setIsEditBookOpen] = useState(false);
  const [isImportBookOpen, setIsImportBookOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date_added_desc');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!isFirebaseConfigured) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      try {
        const [booksResult, initialAuthors, initialGenres, initialSeries] = await Promise.all([
            getPaginatedBooksWithDetails({ limit: 1000 }), // Fetch all books
            fetchAllAuthors(),
            fetchAllGenres(),
            fetchAllSeries()
        ]);
        setBooks(booksResult.books);
        setAuthors(initialAuthors);
        setGenres(initialGenres);
        setSeries(initialSeries);
        
      } catch (error) {
        console.error("Failed to load data from Firebase", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load data from the database."});
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  const handleBookAdded = async (newBookData: Omit<Book, 'id' | 'docId'>) => {
    if (!db) return;
    const newId = generateId(6);

    try {
        let bookToSave: Omit<Book, 'docId'> = { 
            ...newBookData, 
            id: newId,
            createdAt: Date.now()
        };
        
        const docRef = await addDoc(collection(db, "books"), bookToSave);
        const newBook: Book = { ...bookToSave, docId: docRef.id };
        
        setBooks(prev => [newBook, ...prev]);

        if (newBook.series && !series.some(s => s.name === newBook.series)) {
            handleSeriesAdded({ name: newBook.series }, false);
        }
        toast({
            title: "Thêm sách thành công",
            description: `Sách "${newBook.title}" đã được thêm.`,
        });
    } catch (e) {
        console.error("Error adding document: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not add book."});
    }
  };

  const handleBooksImported = async (newBooks: ImportBook[]) => {
     if (!db) return;
    if (newBooks.length === 0) {
      toast({
        title: "Không có sách mới nào được thêm",
        description: "Có thể tất cả sách trong tệp đã tồn tại hoặc không hợp lệ.",
      });
      return;
    }

    try {
        const booksForFirestore = newBooks.map(book => {
            const { ...rest } = book;
            return {
                ...rest,
                createdAt: Date.now(),
            };
        });

        await Promise.all(booksForFirestore.map(book => addDoc(collection(db, "books"), book)));
        
        const freshBooksResult = await getPaginatedBooksWithDetails({ limit: 1000 });
        setBooks(freshBooksResult.books);

        const importedSeriesNames = new Set(newBooks.map(b => b.series).filter((s): s is string => !!s));
        const existingSeriesNames = new Set(series.map(s => s.name));
        const newSeriesToCreate = [...importedSeriesNames].filter(name => !existingSeriesNames.has(name));

        if (newSeriesToCreate.length > 0) {
           await Promise.all(newSeriesToCreate.map(name => addDoc(collection(db, "series"), { name })));
           const freshSeries = await fetchAllSeries();
           setSeries(freshSeries);
        }

        toast({
            title: "Import thành công",
            description: `${newBooks.length} sách mới đã được thêm vào bộ sưu tập của bạn.`,
        });
    } catch(e) {
         console.error("Error importing books: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not import books."});
    }
  };

  const handleAuthorsImported = async (newNames: string[]) => {
    if (!db) return;
    try {
        const newAuthorDocs = newNames.map(name => ({ name }));
        await Promise.all(newAuthorDocs.map(author => addDoc(collection(db, "authors"), author)));
        
        const freshAuthors = await fetchAllAuthors();
        setAuthors(freshAuthors);

        toast({
            title: "Import tác giả thành công",
            description: `${newNames.length} tác giả mới đã được thêm.`,
        });
    } catch(e) {
         console.error("Error importing authors: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not import authors."});
    }
  };

  const handleGenresImported = async (newNames: string[]) => {
    if (!db) return;
    try {
        const newGenreDocs = newNames.map(name => ({ name }));
        await Promise.all(newGenreDocs.map(genre => addDoc(collection(db, "genres"), genre)));
        
        const freshGenres = await fetchAllGenres();
        setGenres(freshGenres);

        toast({
            title: "Import thể loại thành công",
            description: `${newNames.length} thể loại mới đã được thêm.`,
        });
    } catch(e) {
         console.error("Error importing genres: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not import genres."});
    }
  };

  const handleSeriesImported = async (newNames: string[]) => {
    if (!db) return;
    try {
        const newSeriesDocs = newNames.map(name => ({ name }));
        await Promise.all(newSeriesDocs.map(s => addDoc(collection(db, "series"), s)));

        const freshSeries = await fetchAllSeries();
        setSeries(freshSeries);

        toast({
            title: "Import series thành công",
            description: `${newNames.length} series mới đã được thêm.`,
        });
    } catch (e) {
        console.error("Error importing series: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not import series." });
    }
  };

 const handleBookUpdated = async (updatedBook: Book) => {
    if (!db || !updatedBook.docId) return;
    try {
        const bookRef = doc(db, "books", updatedBook.docId);
        
        const { docId, ...bookData } = updatedBook;
        await updateDoc(bookRef, bookData);

        const updatedBooks = books.map(book => book.docId === updatedBook.docId ? updatedBook : book);
        setBooks(updatedBooks);
        
        if (updatedBook.series && !series.some(s => s.name === updatedBook.series)) {
            handleSeriesAdded({ name: updatedBook.series }, false);
        }
        toast({
            title: "Cập nhật sách thành công",
            description: `Sách "${updatedBook.title}" đã được cập nhật.`,
        });
    } catch (e) {
        console.error("Error updating document: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not update book."});
    }
  };

  const handleBookDeleted = async (bookToDelete: Book) => {
    if (!db || !bookToDelete.docId) return;
    
    try {
        await deleteDoc(doc(db, "books", bookToDelete.docId));
        const updatedBooks = books.filter(book => book.docId !== bookToDelete.docId);
        setBooks(updatedBooks);
        toast({
            variant: "destructive",
            title: "Đã xóa sách",
            description: `Sách "${bookToDelete.title}" đã được xóa.`,
        });
    } catch(e) {
        console.error("Error deleting document: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not delete book."});
    }
  }

  const handleAuthorAdded = async (newAuthorData: Omit<Author, 'id'>) => {
    if (!db) return;
    try {
        const docRef = await addDoc(collection(db, "authors"), newAuthorData);
        const updatedAuthors = [{ ...newAuthorData, id: docRef.id }, ...authors];
        setAuthors(updatedAuthors);
        toast({
            title: "Thêm tác giả thành công",
            description: `Tác giả "${newAuthorData.name}" đã được thêm.`,
        });
    } catch(e) {
        console.error("Error adding author: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not add author."});
    }
  };
  
  const handleAuthorUpdated = async (updatedAuthor: Author) => {
    if (!db) return;
    try {
        const { id, ...authorData } = updatedAuthor;
        await updateDoc(doc(db, "authors", id), authorData);
        
        setAuthors(prev => prev.map(a => a.id === id ? updatedAuthor : a).sort((a,b) => a.name.localeCompare(b.name)));
        toast({
            title: "Cập nhật tác giả thành công",
            description: `Tác giả "${updatedAuthor.name}" đã được cập nhật.`,
        });
    } catch(e) {
        console.error("Error updating author: ", e);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật tác giả."});
    }
  };

  const handleAuthorDeleted = async (authorId: string) => {
    if (!db) return;
    const authorToDelete = authors.find(b => b.id === authorId);
    if (!authorToDelete) return;
    try {
        await deleteDoc(doc(db, "authors", authorId));
        const updatedAuthors = authors.filter(author => author.id !== authorId);
        setAuthors(updatedAuthors);
        toast({
            variant: "destructive",
            title: "Đã xóa tác giả",
            description: `Tác giả "${authorToDelete.name}" đã được xóa.`,
        });
    } catch(e) {
        console.error("Error deleting author: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not delete author."});
    }
  }
  
  const handleGenreAdded = async (newGenreData: Omit<Genre, 'id'>) => {
    if (!db) return;
    try {
        const docRef = await addDoc(collection(db, "genres"), newGenreData);
        const updatedGenres = [{ ...newGenreData, id: docRef.id }, ...genres];
        setGenres(updatedGenres);
        toast({
          title: "Thêm thể loại thành công",
          description: `Thể loại "${newGenreData.name}" đã được thêm.`,
        });
    } catch(e) {
        console.error("Error adding genre: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not add genre."});
    }
  };

  const handleGenreUpdated = async (updatedGenre: Genre) => {
    if (!db) return;
    try {
        const { id, ...genreData } = updatedGenre;
        await updateDoc(doc(db, "genres", id), genreData);

        setGenres(prev => prev.map(g => g.id === id ? updatedGenre : g).sort((a,b) => a.name.localeCompare(b.name)));
        toast({
            title: "Cập nhật thể loại thành công",
            description: `Thể loại "${updatedGenre.name}" đã được cập nhật.`,
        });
    } catch(e) {
        console.error("Error updating genre: ", e);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật thể loại."});
    }
  };

  const handleGenreDeleted = async (genreId: string) => {
    if (!db) return;
    const genreToDelete = genres.find(g => g.id === genreId);
    if (!genreToDelete) return;

    try {
        await deleteDoc(doc(db, "genres", genreId));
        const updatedGenres = genres.filter(genre => genre.id !== genreId);
        setGenres(updatedGenres);
        toast({
            variant: "destructive",
            title: "Đã xóa thể loại",
            description: `Thể loại "${genreToDelete.name}" đã được xóa.`,
        });
    } catch(e) {
        console.error("Error deleting genre: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not delete genre."});
    }
  }

  const handleSeriesAdded = async (newSeriesData: { name: string }, showToast = true) => {
    if (!db) return;
    if (series.some(s => s.name.toLowerCase() === newSeriesData.name.toLowerCase())) {
        if (showToast) {
            toast({
                variant: "destructive",
                title: "Series đã tồn tại",
                description: `Series "${newSeriesData.name}" đã có trong danh sách.`,
            });
        }
        return;
    }
    try {
        const docRef = await addDoc(collection(db, "series"), newSeriesData);
        const newSeries = { ...newSeriesData, id: docRef.id };
        setSeries(prev => [...prev, newSeries].sort((a, b) => a.name.localeCompare(b.name)));
        if (showToast) {
            toast({
                title: "Thêm series thành công",
                description: `Series "${newSeries.name}" đã được thêm.`,
            });
        }
    } catch (e) {
        console.error("Error adding series:", e);
        if (showToast) {
            toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm series." });
        }
    }
  };

  const handleSeriesDeleted = async (seriesId: string) => {
    if (!db) return;
    const seriesToDelete = series.find(s => s.id === seriesId);
    if (!seriesToDelete) return;
    
    const isSeriesInUse = books.some(book => book.series === seriesToDelete.name);
    if (isSeriesInUse) {
        toast({
            variant: "destructive",
            title: "Không thể xóa Series",
            description: `Series "${seriesToDelete.name}" đang được sử dụng bởi một hoặc nhiều sách.`,
        });
        return;
    }
    try {
        await deleteDoc(doc(db, "series", seriesId));
        setSeries(prev => prev.filter(s => s.id !== seriesId));
        toast({
            variant: "destructive",
            title: "Đã xóa Series",
            description: `Series "${seriesToDelete.name}" đã được xóa.`,
        });
    } catch (e) {
         console.error("Error deleting series:", e);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa series." });
    }
  };

  const handleSeriesUpdated = async (seriesId: string, newName: string) => {
    if (!db) return;
    const seriesToUpdate = series.find(s => s.id === seriesId);
    if (!seriesToUpdate) return;
    const oldName = seriesToUpdate.name;

    if (series.some(s => s.name.toLowerCase() === newName.toLowerCase() && s.id !== seriesId)) {
        toast({
            variant: "destructive",
            title: "Series đã tồn tại",
            description: `Series "${newName}" đã có trong danh sách.`,
        });
        return;
    }

    try {
        const seriesRef = doc(db, "series", seriesId);
        await updateDoc(seriesRef, { name: newName });
        
        const booksToUpdate = books.filter(book => book.series === oldName);
        const updatePromises = booksToUpdate.map(book => {
            if (!book.docId) return Promise.resolve();
            const bookRef = doc(db, "books", book.docId);
            return updateDoc(bookRef, { series: newName });
        });

        await Promise.all(updatePromises);
        
        const freshSeries = await fetchAllSeries();
        setSeries(freshSeries);

        const updatedBooks = books.map(book => {
            if (book.series === oldName) {
                return { ...book, series: newName };
            }
            return book;
        });
        setBooks(updatedBooks);
        toast({
            title: "Cập nhật Series thành công",
            description: `Series "${oldName}" đã được đổi tên thành "${newName}".`,
        });
    } catch(e) {
        console.error("Error updating series: ", e);
        toast({ variant: "destructive", title: "Error", description: "Could not update series."});
    }
  };

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setIsEditBookOpen(true);
  };

  const getAuthorName = (authorId: string) => {
    return authors.find(a => a.id === authorId)?.name || 'N/A';
  }

  const getBookGenres = (genreIds: string[] | undefined): Genre[] => {
    if (!genreIds) return [];
    return genreIds.map(id => genres.find(g => g.id === id)).filter((g): g is Genre => !!g);
  };

  const filteredAndSortedBooks = useMemo(() => {
    const filtered = books.filter(book => 
      book.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      getAuthorName(book.authorId).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch(sortOption) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
            return b.title.localeCompare(a.title);
        case 'publication_date_desc':
          return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
        case 'publication_date_asc':
            return new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime();
        case 'date_added_desc':
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });
  }, [books, debouncedSearchTerm, sortOption, authors]);

  return (
    <>
      <div className="flex items-center justify-end gap-2 mb-4">
          <Dialog open={isImportBookOpen} onOpenChange={setIsImportBookOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline">
                      <Upload className="mr-2" />
                      Import from Json file
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                  <DialogHeader>
                      <DialogTitle>Import dữ liệu</DialogTitle>
                  </DialogHeader>
                  <ImportBooksDialog
                    existingBooks={books}
                    existingAuthors={authors}
                    existingGenres={genres}
                    existingSeries={series}
                    onBooksImported={handleBooksImported}
                    onAuthorsImported={handleAuthorsImported}
                    onGenresImported={handleGenresImported}
                    onSeriesImported={handleSeriesImported}
                    onFinished={() => setIsImportBookOpen(false)}
                  />
              </DialogContent>
          </Dialog>
          <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
              <DialogTrigger asChild>
                  <Button>
                      <PlusCircle className="mr-2" />
                      Thêm sách
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                  <DialogHeader>
                      <DialogTitle>Thêm sách mới</DialogTitle>
                  </DialogHeader>
                  <AddBookForm 
                    books={books}
                    onBookAdded={(bookData) => handleBookAdded(bookData)}
                    onFinished={() => setIsAddBookOpen(false)}
                    authors={authors}
                    genres={genres}
                    seriesList={series}
                  />
              </DialogContent>
          </Dialog>
      </div>

     <Tabs defaultValue="books">
        <TabsList>
            <TabsTrigger value="books">Sách</TabsTrigger>
            <TabsTrigger value="authors">Tác giả</TabsTrigger>
            <TabsTrigger value="genres">Thể loại</TabsTrigger>
            <TabsTrigger value="series">Series</TabsTrigger>
        </TabsList>
        <TabsContent value="books" className="mt-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm sách hoặc tác giả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Sắp xếp theo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_added_desc">Mới nhất</SelectItem>
                  <SelectItem value="title_asc">Tên sách (A-Z)</SelectItem>
                  <SelectItem value="title_desc">Tên sách (Z-A)</SelectItem>
                  <SelectItem value="publication_date_desc">Ngày phát hành (Mới nhất)</SelectItem>
                  <SelectItem value="publication_date_asc">Ngày phát hành (Cũ nhất)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            ) : (
            <>
                <div className="border rounded-md">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[60px]">Ảnh bìa</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Tác giả</TableHead>
                        <TableHead>Thể loại</TableHead>
                        <TableHead>Ngày phát hành</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedBooks.map((book) => {
                            const bookGenres = getBookGenres(book.genreIds);
                            const displayedGenres = bookGenres.slice(0, 3);
                            const remainingCount = bookGenres.length - displayedGenres.length;
                            return (
                            <TableRow key={book.docId || book.id}>
                                <TableCell>
                                    <Image
                                        src={book.coverImages.size250.trim()}
                                        alt={`Bìa sách ${book.title}`}
                                        width={40}
                                        height={60}
                                        className="rounded-sm object-cover"
                                        data-ai-hint="book cover"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{book.title}</TableCell>
                                <TableCell>{getAuthorName(book.authorId)}</TableCell>
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {displayedGenres.map(genre => (
                                                        <Badge key={genre.id} variant="secondary">{genre.name}</Badge>
                                                    ))}
                                                    {remainingCount > 0 && (
                                                        <Badge variant="outline">+{remainingCount}</Badge>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            {bookGenres.length > 3 && (
                                                <TooltipContent>
                                                    <p>{bookGenres.map(g => g.name).join(', ')}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                    {new Date(book.publicationDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/book/${book.id}-${slugify(book.title)}`}>
                                                    <Eye className="mr-2 h-4 w-4"/>
                                                    View
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditClick(book)}>
                                                <Pencil className="mr-2 h-4 w-4"/>
                                                Sửa
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setBookToDelete(book)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4"/>
                                                Xóa
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Tổng cộng {filteredAndSortedBooks.length} quyển sách.
                    </div>
                </div>
            </>
            )}
        </TabsContent>
        <TabsContent value="authors" className="mt-4">
            <AuthorManagement 
              authors={authors}
              books={books}
              isLoading={isLoading}
              onAuthorAdded={(author) => handleAuthorAdded(author)}
              onAuthorUpdated={handleAuthorUpdated}
              onAuthorDeleted={handleAuthorDeleted}
            />
        </TabsContent>
        <TabsContent value="genres" className="mt-4">
            <GenreManagement 
              genres={genres}
              books={books}
              isLoading={isLoading}
              onGenreAdded={(genre) => handleGenreAdded(genre)}
              onGenreUpdated={handleGenreUpdated}
              onGenreDeleted={handleGenreDeleted}
            />
        </TabsContent>
        <TabsContent value="series" className="mt-4">
            <SeriesManagement 
              series={series}
              books={books}
              isLoading={isLoading}
              onSeriesAdded={handleSeriesAdded}
              onSeriesDeleted={handleSeriesDeleted}
              onSeriesUpdated={handleSeriesUpdated}
            />
        </TabsContent>
     </Tabs>
     
    <Dialog open={isEditBookOpen} onOpenChange={setIsEditBookOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Sửa thông tin sách</DialogTitle>
            </DialogHeader>
            {editingBook && (
                <EditBookForm 
                    bookToEdit={editingBook}
                    onBookUpdated={handleBookUpdated} 
                    onFinished={() => {
                        setIsEditBookOpen(false);
                        setEditingBook(null);
                    }}
                    authors={authors}
                    genres={genres}
                    seriesList={series}
                />
            )}
        </DialogContent>
    </Dialog>

    <AlertDialog open={!!bookToDelete} onOpenChange={(isOpen) => !isOpen && setBookToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn sách "{bookToDelete?.title}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={() => {
                        if (bookToDelete) {
                            handleBookDeleted(bookToDelete);
                            setBookToDelete(null);
                        }
                    }} 
                    className={buttonVariants({ variant: "destructive" })}
                >
                    Xóa
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
