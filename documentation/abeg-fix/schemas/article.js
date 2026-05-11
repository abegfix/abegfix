export default {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string'},
    {name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}},
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    },
    {name: 'content', title: 'Content', type: 'array', of: [{type: 'block'}]}, // Rich Text
  ],
}
