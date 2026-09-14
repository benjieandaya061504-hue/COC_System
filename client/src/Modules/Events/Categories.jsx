import { useState, useEffect } from 'react'
import axiosClient from '../../api/axiosClient.js'
import './Categories.css'

// TODO: wire to API — replace useState(defaultCategories) with useEffect fetch
//   useEffect(() => {
//     axiosClient.get('/api/categories').then(...)
//   }, [])

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#4caf50')

  // Fetch categories from API on mount
  useEffect(() => {
    axiosClient.get('/events/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Failed to load categories:', err))
  }, [])

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const saveEdit = (cat) => {
    if (!editName.trim()) return
    axiosClient.put(`/events/categories/${cat.id}`, {
      name: editName.trim(),
      color: editColor,
    })
      .then((res) => {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id ? { ...c, name: res.data.name, color: res.data.color } : c
          )
        )
        cancelEdit()
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'Failed to update category'
        alert(msg)
      })
  }

  const addCategory = () => {
    if (!newName.trim()) return
    axiosClient.post('/events/categories', {
      name: newName.trim(),
      color: newColor,
    })
      .then((res) => {
        setCategories((prev) => [...prev, res.data])
        setNewName('')
        setNewColor('#4caf50')
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'Failed to add category'
        alert(msg)
      })
  }

  const deleteCategory = (id, name) => {
    if (categories.length <= 1) {
      alert('At least one category is required.')
      return
    }
    if (!confirm(`Delete category "${name}"?`)) return
    axiosClient.delete(`/events/categories/${id}`)
      .then(() => {
        setCategories((prev) => prev.filter((c) => c.id !== id))
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'Failed to delete category'
        alert(msg)
      })
  }

  const colorPresets = [
    '#e91e63', '#9c27b0', '#03a9f4', '#607d8b', '#4caf50',
    '#ff5722', '#795548', '#2196f3', '#ff9800', '#009688',
  ]

  return (
    <div className="categories-page">
      <h2>Event Categories</h2>

      {/* Add form */}
      <div className="cat-add-form">
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          title="Pick a color"
        />
        <button className="btn btn-primary" onClick={addCategory}>Add</button>
      </div>

      {/* Category list */}
      <table className="cat-table">
        <thead>
          <tr>
            <th>Color</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td>
                <span
                  className="cat-color-swatch"
                  style={{ background: cat.color }}
                />
              </td>
              <td>
                {editingId === cat.id ? (
                  <div className="cat-edit-inline">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                    />
                    <button className="btn btn-sm btn-primary" onClick={() => saveEdit(cat)}>Save</button>
                    <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <span>{cat.name}</span>
                )}
              </td>
              <td className="cat-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => startEdit(cat)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteCategory(cat.id, cat.name)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}