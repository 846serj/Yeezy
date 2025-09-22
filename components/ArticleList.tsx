'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWordPress } from '@/hooks/useWordPress';
import { WordPressPost } from '@/types';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  Tag,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ArticleListProps {
  onSelectArticle: (article: WordPressPost) => void;
  onCreateNew: () => void;
  onGenerateNew: () => void;
  statusFilter: string;
}

export const ArticleList: React.FC<ArticleListProps> = ({ onSelectArticle, onCreateNew, onGenerateNew, statusFilter }) => {
  const router = useRouter();
  const { fetchPosts, loading, error } = useWordPress();
  const [articles, setArticles] = useState<WordPressPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  // Map UI status values to WordPress API status values
  const mapStatusToWordPress = (status: string) => {
    switch (status) {
      case 'published':
        return 'publish';
      case 'draft':
        return 'draft';
      case 'pending':
        return 'pending';
      case 'private':
        return 'private';
      case 'all':
      default:
        return undefined;
    }
  };

  const loadArticles = async (page = 1, search = '', status = 'all', append = false) => {
    try {
      const result = await fetchPosts({
        page,
        per_page: 15,
        search: search || undefined,
        status: mapStatusToWordPress(status),
        orderby: 'date',
        order: 'desc',
      });
      
      setTotalPages(result.totalPages);
      setTotalArticles(result.total);
      
      // If appending (Load More), add to existing articles
      if (append && page > 1) {
        setArticles(prevArticles => [...prevArticles, ...result.posts]);
      } else {
        // If not appending, replace articles (new search or status filter)
        setArticles(result.posts);
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    }
  };

  // Load articles when component mounts or statusFilter changes
  useEffect(() => {
    setCurrentPage(1);
    loadArticles(1, searchTerm, statusFilter);
  }, [statusFilter]);

  // Load articles when component first mounts
  useEffect(() => {
    loadArticles(1, '', statusFilter);
  }, []);

  // Real-time search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        loadArticles(1, searchTerm, statusFilter);
      } else if (searchTerm === '') {
        // If search is cleared, reload all articles
        setCurrentPage(1);
        loadArticles(1, '', statusFilter);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadArticles(1, searchTerm, statusFilter);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'publish':
        return 'green-255-text';
      case 'draft':
        return 'yellow-255-text';
      case 'private':
        return 'red-255-text';
      case 'pending':
        return 'orange-255-text';
      default:
        return 'white-255-text';
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  };

  if (error) {
    return (
      <div className="center">
        <div>
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h3>Failed to load articles</h3>
          <p>{error}</p>
          <button
            className="tui-button"
            onClick={() => loadArticles(currentPage, searchTerm, statusFilter)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Input and Action Buttons */}
      <div style={{ marginBottom: 'var(--space-20)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-20)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-20)', alignItems: 'center' }}>
          {/* Back Button */}
          <button 
            className="tui-button"
            onClick={() => router.push('/')}
            title="Back to Home"
          >
            &lt;
          </button>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-10)', alignItems: 'center', maxWidth: 'var(--space-300)' }}>
            <input
              type="text"
              className="tui-input"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
            {/* <button
              type="submit"
              className="tui-button"
              disabled={!searchTerm}
            >
              Search
            </button> */}
          </form>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-10)', alignItems: 'center' }}>
          {/* <button 
            className="tui-button"
            onClick={onCreateNew}
            title="Create new article"
          >
            <span className="tui-shortcut">N</span>New Article
          </button> */}
          <button 
            className="tui-button"
            onClick={onGenerateNew}
            title="Generate article with AI"
          >
            Generate Article
          </button>
        </div>
      </div>

      {/* Articles List */}
      {loading && articles.length === 0 ? (
        <div className="center">
          <Loader2 className="spinner me-2" />
          Loading articles...
        </div>
      ) : articles.length === 0 ? (
        <div className="center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h3>No articles found</h3>
          <p>
            {searchTerm ? 'Try adjusting your search terms.' : 'Use the buttons above to create your first article.'}
          </p>
        </div>
      ) : (
        <table className="tui-table hovered-cyan" style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Title</th>
              <th style={{ width: '20%' }}>Author</th>
              <th style={{ width: '20%' }}>Date</th>
              <th style={{ width: '20%' }}>Status</th>
              {/* <th>Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr
                key={article.id}
                onClick={() => onSelectArticle(article)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div 
                    style={{ 
                      fontWeight: 'bold', 
                      marginBottom: 'var(--space-4)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 'var(--space-300)'
                    }}
                    title={article.title.rendered}
                  >
                    {article.title.rendered}
                  </div>
                  {/* <div style={{ fontSize: '0.9em', color: '#888' }}>
                    {stripHtml(article.content.rendered)}
                  </div> */}
                </td>
                <td>
                  <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)'
                  }}>
                    <User size={12} className="me-1" />
                    <span title={article._embedded?.author?.[0]?.name || `Author ${article.author}`}>
                      {article._embedded?.author?.[0]?.name || `Author ${article.author}`}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {/* <Calendar size={12} className="me-1" /> */}
                    {formatDate(article.date)}
                  </div>
                </td>
                <td>
                  <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <span className={getStatusColor(article.status)}>
                      {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                    </span>
                  </div>
                </td>
                {/* <td>
                  <button
                    className="tui-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArticle(article);
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'var(--space-20)' }}>
          {/* <small>
            Showing {articles.length} of {totalArticles} articles
          </small> */}
          <div>
              <button
                className="tui-button"
                disabled={currentPage === 1}
                onClick={() => {
                  const newPage = currentPage - 1;
                  setCurrentPage(newPage);
                  loadArticles(newPage, searchTerm, statusFilter);
                }}
              >
                Previous
              </button>
              <span className="tui-button disabled">
                {currentPage} / {totalPages}
              </span>
              <button
                className="tui-button"
                disabled={currentPage === totalPages}
                onClick={() => {
                  const newPage = currentPage + 1;
                  setCurrentPage(newPage);
                  loadArticles(newPage, searchTerm, statusFilter);
                }}
              >
                Next
              </button>
            </div>
        </div>
      )}
    </div>
  );
};