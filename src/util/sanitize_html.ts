import sanitizeHTML from 'sanitize-html';

export default function sanitize_html(string: string): string {
  string = sanitizeHTML(string, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return string;
}
