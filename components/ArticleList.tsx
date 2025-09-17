'use client';

import React, { useState, useEffect } from 'react';
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
  const { fetchPosts, loading, error } = useWordPress();
  const [articles, setArticles] = useState<WordPressPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  const loadArticles = async (page = 1, search = '', status = 'all', append = false) => {
    try {
      const result = await fetchPosts({
        page,
        per_page: 10,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
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
        return 'status-published';
      case 'draft':
        return 'status-draft';
      case 'private':
        return 'muted';
      case 'pending':
        return 'muted';
      default:
        return 'muted';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'publish':
        return { color: '#16a34a', fontWeight: '600' }; // green
      case 'draft':
        return { color: '#000000', fontWeight: '600' }; // black
      case 'private':
        return { color: '#6b7280', fontWeight: '600' }; // gray
      case 'pending':
        return { color: '#6b7280', fontWeight: '600' }; // gray
      default:
        return { color: '#6b7280', fontWeight: '600' }; // gray
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  };


  if (error) {
    return (
      <div className="center" style={{ padding: '4rem 0' }}>
        <div>
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#dc2626' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Failed to load articles</h3>
          <p className="muted" style={{ marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={() => loadArticles(currentPage, searchTerm, statusFilter)}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with action buttons */}
      <div className="editor-head" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Articles</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onGenerateNew}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus className="h-4 w-4" />
            Generate Article
          </button>
          <button
            onClick={onCreateNew}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>
        </div>
      </div>

      {/* Search and filters moved to header row */}

      {/* Table */}
      <div className="table-wrap">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th scope="col" style={{ padding: '0.5rem 0', fontWeight: '600' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>Title</span>
                  <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      className="input"
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch(e);
                        }
                      }}
                      style={{ 
                        border: '4px solid #000', 
                        borderRadius: '20px', 
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                        width: '137.5px',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.border = '4px solid #3b82f6'}
                      onBlur={(e) => e.target.style.border = '4px solid #000'}
                    />
                    <button
                      type="submit"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Search className="h-4 w-4" style={{ color: '#6b7280' }} />
                    </button>
                  </form>
                </div>
              </th>
              <th scope="col" style={{ padding: '0rem 0', fontWeight: '600', textAlign: 'right' }}>Status</th>
              <th scope="col" style={{ padding: '0rem 0', fontWeight: '600' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="status-cell center">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading articles...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={3} className="status-cell muted center">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No articles found matching your search.'
                    : 'No articles found.'}
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="scaleOnHover" style={{ borderBottom: '4px solid #000' }}>
                  <td style={{ padding: '0.5rem 0' }}>
                    <a
                      className="row-link"
                      onClick={() => onSelectArticle(article)}
                      style={{ cursor: 'pointer', color: '#000000', fontWeight: '600' }}
                    >
                      {article.title.rendered}
                    </a>
                  </td>
                  <td className={`status-cell ${getStatusColor(article.status)}`} style={{ textAlign: 'right', padding: '0.5rem 0', ...getStatusStyle(article.status) }}>
                    {article.status === 'publish' ? 'Published' : 
                     article.status === 'draft' ? 'Draft' : 
                     article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                  </td>
                  <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                    {/* Edit button removed - clicking title opens editor */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Load More */}
      {!loading && articles.length > 0 && totalPages > 1 && (
        <div className="actions">
          <button
            onClick={() => {
              const nextPage = Math.min(currentPage + 1, totalPages);
              setCurrentPage(nextPage);
              loadArticles(nextPage, searchTerm, statusFilter, true);
            }}
            className="btn"
            disabled={currentPage === totalPages}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
