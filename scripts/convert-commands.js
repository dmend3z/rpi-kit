const fs = require('fs');
const path = require('path');

const srcDir = 'commands/rpi';
const destDir = '.gemini/commands/rpi';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const parts = content.split('---');
  
  if (parts.length < 3) return;

  const frontmatter = parts[1];
  const body = parts.slice(2).join('---').trim();
  
  const descriptionMatch = frontmatter.match(/description:\s*(.*)/);
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';
  
  // Escaping for TOML triple-quoted strings
  // We need to escape \ and triple-quotes """
  const escapedBody = body
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '\\"\\"\\"');

  const tomlContent = `description = ${JSON.stringify(description)}

prompt = """
${escapedBody}
"""
`;

  const destFile = file.replace('.md', '.toml');
  fs.writeFileSync(path.join(destDir, destFile), tomlContent);
  console.log(`Converted ${file} to ${destFile}`);
});
