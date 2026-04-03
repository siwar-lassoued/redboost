const fs = require('fs');
const path = 'src/app/pages/backoffice/candidature_redstarter/admin_reporting_ia/admin-reporting-ia.component.ts';

let content = fs.readFileSync(path, 'utf8');

const map = {
  'sparkles': 'star',
  'plus-circle': 'plus-circle',
  'chevron-down': 'chevron-down',
  'check': 'check',
  'info': 'info-circle',
  'loader-2': 'spinner pi-spin',
  'zap': 'bolt',
  'file-chart-column': 'file',
  'x': 'times',
  'calendar': 'calendar',
  'check-square': 'check-square',
  'file-badge': 'id-card',
  'trending-up': 'chart-line',
  'book-open-check': 'book',
  'alert-triangle': 'exclamation-triangle',
  'siren': 'megaphone',
  'lightbulb': 'lightbulb',
  'files': 'copy',
  'eye': 'eye',
  'trash-2': 'trash',
  'users': 'users',
  'book-open': 'book'
};

content = content.replace(/<lucide-icon\s+name="([^"]+)"(\s+\[size\]="?\d+"?)?.*?><\/lucide-icon>/g, (match, name) => {
  const piName = map[name] || name;
  let exClass = '';
  if (match.includes('class="')) {
     const m = match.match(/class="([^"]+)"/);
     if (m) {
        exClass = ' ' + m[1].replace('animate-spin', '').replace('fill-current', '');
     }
  }
  return `<i class="pi pi-${piName}${exClass}" style="font-size: 1.25rem;"></i>`;
});

// also fix [name]="inc.icon"
content = content.replace(/<lucide-icon \[name\]="inc.icon".*?><\/lucide-icon>/g, '<i [class]="\'pi pi-\' + inc.icon + \' text-gray-400\'"></i>');

// remove lucide imports
content = content.replace(/import \{ LucideAngularModule.*?\} from 'lucide-angular';\r?\n/g, '');
content = content.replace(/LucideAngularModule\.pick\(\{[^\}]+\}\)/g, '');
content = content.replace(/,\s*\]/, ']');


fs.writeFileSync(path, content);
console.log('Fixed icons');
