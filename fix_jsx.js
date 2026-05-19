const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// The issue was: <path ... /> </path>
// We can just remove </path>, </circle>, </img>, etc.
const tagsToRemove = ['path', 'circle', 'img', 'input', 'hr', 'br', 'rect', 'line', 'polygon', 'polyline', 'source'];
tagsToRemove.forEach(tag => {
    const regex = new RegExp(`</${tag}>`, 'g');
    code = code.replace(regex, '');
});

// Also fix unescaped characters in JSX text like <, >, {
// Let's look for "that's" or similar issues, though usually single quotes are fine.
// The main issue was definitely the closing tags for self-closing elements.

// Other common issues: 'stroke-width' -> 'strokeWidth' was done.
// viewBox is already camelCase in the original HTML usually? Let's ensure SVG attributes are camelCased.

fs.writeFileSync('app/page.tsx', code);
console.log('Fixed JSX closing tags');
