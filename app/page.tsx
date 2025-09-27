'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, SearchIcon, TrashIcon, EditIcon, TagIcon, DownloadIcon, UploadIcon, SaveIcon, XIcon, CheckIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

type NotificationState = {
  show: boolean
  message: string
  type: 'success' | 'error' | 'info'
}

const AVAILABLE_TAGS = ['Work', 'Personal', 'Ideas', 'Todo', 'Important', 'Archive']
const MAX_TITLE_LENGTH = 100
const MAX_CONTENT_LENGTH = 10000

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: [] as string[] })
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' })
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'title'>('updated')

  // Load notes from localStorage on component mount
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('notes')
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          tags: note.tags || []
        }))
        setNotes(parsedNotes)
      }
    } catch (error) {
      showNotification('Error loading notes from storage', 'error')
    }
  }, [])

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    try {
      localStorage.setItem('notes', JSON.stringify(notes))
    } catch (error) {
      showNotification('Error saving notes to storage', 'error')
    }
  }, [notes])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            if (!isCreating && !editingNote) {
              setIsCreating(true)
            }
            break
          case 's':
            e.preventDefault()
            if (isCreating) {
              createNote()
            } else if (editingNote) {
              updateNote()
            }
            break
        }
      } else if (e.key === 'Escape') {
        if (isCreating) {
          cancelCreate()
        } else if (editingNote) {
          cancelEdit()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCreating, editingNote, newNote])

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'info' })
    }, 3000)
  }, [])

  const validateNote = (title: string, content: string) => {
    if (!title.trim()) {
      showNotification('Title is required', 'error')
      return false
    }
    if (!content.trim()) {
      showNotification('Content is required', 'error')
      return false
    }
    if (title.length > MAX_TITLE_LENGTH) {
      showNotification(`Title must be less than ${MAX_TITLE_LENGTH} characters`, 'error')
      return false
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      showNotification(`Content must be less than ${MAX_CONTENT_LENGTH} characters`, 'error')
      return false
    }
    return true
  }

  const createNote = useCallback(async () => {
    if (!validateNote(newNote.title, newNote.content)) return
    
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate async operation
      
      const note: Note = {
        id: crypto.randomUUID(),
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        tags: [...newNote.tags],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setNotes(prev => [note, ...prev])
      setNewNote({ title: '', content: '', tags: [] })
      setIsCreating(false)
      showNotification('Note created successfully!', 'success')
    } catch (error) {
      showNotification('Failed to create note', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [newNote, showNotification])

  const updateNote = useCallback(async () => {
    if (!editingNote || !validateNote(editingNote.title, editingNote.content)) return
    
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate async operation
      
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id 
          ? { 
              ...editingNote, 
              title: editingNote.title.trim(),
              content: editingNote.content.trim(),
              updatedAt: new Date() 
            }
          : note
      ))
      setEditingNote(null)
      showNotification('Note updated successfully!', 'success')
    } catch (error) {
      showNotification('Failed to update note', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [editingNote, showNotification])

  const deleteNote = useCallback((id: string) => {
    const noteToDelete = notes.find(note => note.id === id)
    if (noteToDelete) {
      setNotes(prev => prev.filter(note => note.id !== id))
      showNotification(`"${noteToDelete.title}" deleted successfully`, 'success')
    }
  }, [notes, showNotification])

  const startEdit = useCallback((note: Note) => {
    setEditingNote({
      ...note,
      title: note.title,
      content: note.content,
      tags: [...note.tags]
    })
  }, [])

  const cancelCreate = useCallback(() => {
    setNewNote({ title: '', content: '', tags: [] })
    setIsCreating(false)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingNote(null)
  }, [])

  const exportNotes = useCallback(() => {
    try {
      const dataStr = JSON.stringify(notes, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      const exportFileDefaultName = `notes-export-${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      showNotification(`Exported ${notes.length} notes successfully!`, 'success')
    } catch (error) {
      showNotification('Failed to export notes', 'error')
    }
  }, [notes, showNotification])

  const importNotes = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedNotes = JSON.parse(e.target?.result as string)
        if (Array.isArray(importedNotes)) {
          const validNotes = importedNotes.map((note: any) => ({
            ...note,
            id: note.id || crypto.randomUUID(),
            createdAt: new Date(note.createdAt || new Date()),
            updatedAt: new Date(note.updatedAt || new Date()),
            tags: note.tags || []
          }))
          setNotes(prev => [...validNotes, ...prev])
          showNotification(`Imported ${validNotes.length} notes successfully!`, 'success')
        } else {
          showNotification('Invalid file format', 'error')
        }
      } catch (error) {
        showNotification('Failed to import notes', 'error')
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }, [showNotification])

  const filteredAndSortedNotes = useCallback(() => {
    let filtered = notes.filter(note => {
      const matchesSearch = searchTerm === '' || 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => note.tags.includes(tag))
      
      return matchesSearch && matchesTags
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
  }, [notes, searchTerm, selectedTags, sortBy])

  const toggleTag = (tag: string, isNewNote = false) => {
    if (isNewNote) {
      setNewNote(prev => ({
        ...prev,
        tags: prev.tags.includes(tag) 
          ? prev.tags.filter(t => t !== tag)
          : [...prev.tags, tag]
      }))
    } else if (editingNote) {
      setEditingNote(prev => prev ? {
        ...prev,
        tags: prev.tags.includes(tag) 
          ? prev.tags.filter(t => t !== tag)
          : [...prev.tags, tag]
      } : null)
    }
  }

  const toggleSelectedTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const displayedNotes = filteredAndSortedNotes()

  return (
    <div className="px-4 sm:px-0">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckIcon className="h-4 w-4" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Notes</h2>
            <p className="text-sm text-gray-500 mt-1">
              {notes.length} notes • {displayedNotes.length} shown
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              onChange={importNotes}
              className="hidden"
              id="import-notes"
            />
            <label
              htmlFor="import-notes"
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Import
            </label>
            <button
              onClick={exportNotes}
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        
        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes... (Ctrl+F)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'created' | 'updated' | 'title')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="title">Title</option>
            </select>
            
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Note
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleSelectedTag(tag)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Create Note Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Note</h3>
                <button
                  onClick={cancelCreate}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={MAX_TITLE_LENGTH}
                disabled={isLoading}
              />
              <div className="text-xs text-gray-500 mb-4">
                {newNote.title.length}/{MAX_TITLE_LENGTH} characters
              </div>
              
              <textarea
                placeholder="Write your note here..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg note-editor"
                rows={10}
                maxLength={MAX_CONTENT_LENGTH}
                disabled={isLoading}
              />
              <div className="text-xs text-gray-500 mb-4">
                {newNote.content.length}/{MAX_CONTENT_LENGTH} characters
              </div>

              {/* Tags */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag, true)}
                      className={`inline-flex items-center px-2 py-1 rounded text-sm transition-colors ${
                        newNote.tags.includes(tag)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isLoading}
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={createNote}
                  disabled={isLoading || !newNote.title.trim() || !newNote.content.trim()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <SaveIcon className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Note (Ctrl+S)'}
                </button>
                <button
                  onClick={cancelCreate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel (Esc)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Note</h3>
                <button
                  onClick={cancelEdit}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={MAX_TITLE_LENGTH}
                disabled={isLoading}
              />
              <div className="text-xs text-gray-500 mb-4">
                {editingNote.title.length}/{MAX_TITLE_LENGTH} characters
              </div>
              
              <textarea
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg note-editor"
                rows={10}
                maxLength={MAX_CONTENT_LENGTH}
                disabled={isLoading}
              />
              <div className="text-xs text-gray-500 mb-4">
                {editingNote.content.length}/{MAX_CONTENT_LENGTH} characters
              </div>

              {/* Tags */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag, false)}
                      className={`inline-flex items-center px-2 py-1 rounded text-sm transition-colors ${
                        editingNote.tags.includes(tag)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isLoading}
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={updateNote}
                  disabled={isLoading || !editingNote.title.trim() || !editingNote.content.trim()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <SaveIcon className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Updating...' : 'Update Note (Ctrl+S)'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel (Esc)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {displayedNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedTags.length > 0 ? 'No notes found' : 'No notes yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedTags.length > 0
              ? 'Try adjusting your search terms or filters'
              : 'Create your first note to get started'
            }
          </p>
          {!searchTerm && selectedTags.length === 0 && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create First Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedNotes.map((note) => (
            <div key={note.id} className="note-card bg-white rounded-lg shadow-sm border border-gray-200 p-6 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2" title={note.title}>
                  {note.title}
                </h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(note)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit note"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete note"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      <TagIcon className="h-2 w-2 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3" title={note.content}>
                {note.content}
              </p>
              <div className="text-xs text-gray-400">
                {note.updatedAt.getTime() !== note.createdAt.getTime() 
                  ? `Updated ${formatDistanceToNow(note.updatedAt)} ago`
                  : `Created ${formatDistanceToNow(note.createdAt)} ago`
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="mt-12 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
          <div><kbd className="px-2 py-1 bg-white rounded border">Ctrl+N</kbd> New note</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">Ctrl+S</kbd> Save note</div>
          <div><kbd className="px-2 py-1 bg-white rounded border">Esc</kbd> Cancel</div>
        </div>
      </div>
    </div>
  )
}
