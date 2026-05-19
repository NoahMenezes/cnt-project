const fs = require('fs');
let html = fs.readFileSync('demo.html', 'utf8');

// Basic HTML to JSX conversion
html = html.replace(/class=/g, 'className=');
html = html.replace(/for=/g, 'htmlFor=');
html = html.replace(/tabindex=/g, 'tabIndex=');
html = html.replace(/stroke-width=/g, 'strokeWidth=');
html = html.replace(/stroke-linecap=/g, 'strokeLinecap=');
html = html.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
html = html.replace(/fill-rule=/g, 'fillRule=');
html = html.replace(/clip-rule=/g, 'clipRule=');
html = html.replace(/clip-path=/g, 'clipPath=');

// Fix inline styles - very basic fix, since style="color: red" -> style={{color: "red"}}
// This is tricky via regex, so let's just strip inline styles for now or carefully replace them.
// Wait, Tailwind handles most styling. Stripping style attributes might break GSAP initial states, 
// but it's safer for JSX conversion unless we parse it perfectly.
// Let's remove style="..." entirely to avoid React errors, or replace with empty object.
html = html.replace(/style="[^"]*"/g, '');

// Fix self-closing tags
const selfClosingTags = ['img', 'input', 'br', 'hr', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'source'];
selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'g');
    html = html.replace(regex, `<${tag}$1 />`);
});

// Remove <!-- comments -->
html = html.replace(/<!--[\s\S]*?-->/g, '');

// The HTML has a few layout wrappers. Let's extract the main content inside <div data-overlay-container="true">...</div>
// Or just wrap it all in a component.

const jsx = `
export default function Page() {
  return (
    <>
      ${html}
    </>
  );
}
`;

fs.writeFileSync('app/page.tsx', jsx);
console.log('Converted demo.html to app/page.tsx');
