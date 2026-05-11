export default {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string'},
    {name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}},
    {name: 'description', title: 'Description', type: 'text'},
    {name: 'icon', title: 'Icon (Lucide name)', type: 'string'}, // e.g., "settings"
  ],
}
