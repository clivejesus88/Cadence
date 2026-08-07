const fs = require('fs');
const edits = [
  ['src/components/CircularTimer.tsx', "import React, { ReactNode } from 'react';", "import { ReactNode } from 'react';"],
  ['src/components/ui/BarChart.tsx', "import React, { useState } from 'react';", "import { useState } from 'react';"],
  ['src/components/ui/Glass.tsx', "import React, { ReactNode } from 'react';", "import { ReactNode } from 'react';"],
  ['src/components/ui/Screen.tsx', "import React, { ReactNode } from 'react';", "import { ReactNode } from 'react';"],
  ['src/components/ui/GradientButton.tsx', "import React from 'react';", ''],
  ['src/contexts/AppDataContext.tsx', "import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';", "import { createContext, useContext, useMemo, useState, ReactNode } from 'react';"],
  ['src/contexts/SettingsContext.tsx', "import React, { createContext, useContext, useState, ReactNode } from 'react';", "import { createContext, useContext, useState, ReactNode } from 'react';"],
];
let c = 0;
for (const [f, a, b] of edits) {
  let t = fs.readFileSync(f, 'utf8');
  if (t.includes(a)) {
    t = t.replace(a, b);
    fs.writeFileSync(f, t);
    c++;
  }
}
console.log('edited files:', c);
