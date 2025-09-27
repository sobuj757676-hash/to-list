'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, SearchIcon, TrashIcon, EditIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newNote, setNewNote] = useState({ title: '', content: '' })

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes')
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }))
      setNotes(parsedNotes)
    }
  }, [])

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  }, [notes])

  const createNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: Note = {
        id: crypto.randomUUID(),
        title: newNote.title,
        content: newNote.content,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setNotes([note, ...notes])
      setNewNote({ title: '', content: '' })
      setIsCreating(false)
    }
  }

  const updateNote = () => {
    if (editingNote && editingNote.title.trim() && editingNote.content.trim()) {
      setNotes(notes.map(note => 
        note.id === editingNote.id 
          ? { ...editingNote, updatedAt: new Date() }
          : note
      ))
      setEditingNote(null)
    }
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Notes</h2>
        
        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Note
          </button>
        </div>
      </div>

      {/* Create Note Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Note</h3>
              <input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Write your note here..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg note-editor"
                rows={10}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={createNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Note
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewNote({ title: '', content: '' })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
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
              <h3 className="text-lg font-semibold mb-4">Edit Note</h3>
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg note-editor"
                rows={10}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={updateNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Note
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No notes found' : 'No notes yet'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first note to get started'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div key={note.id} className="note-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">
                  {note.title}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingNote(note)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
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
    </div>
  )
}
