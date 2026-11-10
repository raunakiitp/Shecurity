// add exhaustive-deps disables where the dep arrays are intentionally minimal
// (engines are stable singletons created once in the provider lifetime)
import fs from 'node:fs';

const f = 'src/app/ShecurityProvider.tsx';
let t = fs.readFileSync(f, 'utf8');

const pairs = [
  // engine wiring effect
  [
    "      offKwState();\n    };\n  }, []);",
    "      offKwState();\n    };\n    // engines are stable singletons; wiring is intentional-once\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);",
  ],
  // logout
  [
    "    stopEverything();\n    authLogout();\n    setUser(null);\n  }, []);",
    "    stopEverything();\n    authLogout();\n    setUser(null);\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);",
  ],
  // setMonitoring
  [
    "        releaseWakeLock();\n      }\n    },\n    [settings?.sensitivity, settings?.keywords, settings?.lang],\n  );",
    "        releaseWakeLock();\n      }\n    },\n    // engine singletons are stable; settings drive re-creation\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n    [settings?.sensitivity, settings?.keywords, settings?.lang],\n  );",
  ],
  // submitPin
  [
    "      return 'none';\n    },\n    [user],\n  );",
    "      return 'none';\n    },\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n    [user],\n  );",
  ],
  // triggerAlert
  [
    "      startCountdown(trigger);\n    },\n    [settings?.siren, settings?.vibration],\n  );",
    "      startCountdown(trigger);\n    },\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n    [settings?.siren, settings?.vibration],\n  );",
  ],
];

let applied = 0;
for (const [a, b] of pairs) {
  if (t.includes(a)) {
    t = t.split(a).join(b);
    applied++;
  } else {
    console.log('miss:', JSON.stringify(a.slice(0, 50)));
  }
}
fs.writeFileSync(f, t);
console.log('applied', applied, 'of', pairs.length);
