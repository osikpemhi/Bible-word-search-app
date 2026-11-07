import { useState } from 'react';

function CTA() {
  // 1. Track the input value and search results using React state
  const [searchWord, setSearchWord] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [searchError, setSearchError] = useState('');

  async function handleTrace() {
    const searchTerm = searchWord.trim().toLowerCase();
    if (!searchTerm || isLoading) return;

    setIsLoading(true);
    setResults([]);
    setSearchError('');

    const chaptersInfo = {
      GEN: { name: "GEN", chapters: 50 },
      EXO: { name: "EXO", chapters: 40 },
      LEV: { name: "LEV", chapters: 27 },
      NUM: { name: "NUM", chapters: 36 },
      DEU: { name: "DEU", chapters: 34 },
      JOS: { name: "JOS", chapters: 24 },
      JDG: { name: "JDG", chapters: 21 },
      RUT: { name: "RUT", chapters: 4 },
      SA1: { name: "1SA", chapters: 31 },
      SA2: { name: "2SA", chapters: 24 },
      KI1: { name: "1KI", chapters: 22 },
      KI2: { name: "2KI", chapters: 25 },
      CH1: { name: "1CH", chapters: 29 },
      CH2: { name: "2CH", chapters: 36 },
      EZR: { name: "EZR", chapters: 10 },
      NEH: { name: "NEH", chapters: 13 },
      EST: { name: "EST", chapters: 10 },
      JOB: { name: "JOB", chapters: 42 },
      PSA: { name: "PSA", chapters: 150 },
      PRO: { name: "PRO", chapters: 31 },
      ECC: { name: "ECC", chapters: 12 },
      SNG: { name: "SNG", chapters: 8 },
      ISA: { name: "ISA", chapters: 66 },
      JER: { name: "JER", chapters: 52 },
      LAM: { name: "LAM", chapters: 5 },
      EZK: { name: "EZK", chapters: 48 },
      DAN: { name: "DAN", chapters: 12 },
      HOS: { name: "HOS", chapters: 14 },
      JOL: { name: "JOL", chapters: 3 },
      AMO: { name: "AMO", chapters: 9 },
      OBD: { name: "OBA", chapters: 1 },
      JON: { name: "JON", chapters: 4 },
      MIC: { name: "MIC", chapters: 7 },
      NAM: { name: "NAM", chapters: 3 },
      HAB: { name: "HAB", chapters: 3 },
      ZEP: { name: "ZEP", chapters: 3 },
      HAG: { name: "HAG", chapters: 2 },
      ZEC: { name: "ZEC", chapters: 14 },
      MAL: { name: "MAL", chapters: 4 },
      MAT: { name: "MAT", chapters: 28 },
      MRK: { name: "MRK", chapters: 16 },
      LUK: { name: "LUK", chapters: 24 },
      JHN: { name: "JHN", chapters: 21 },
      ACT: { name: "ACT", chapters: 28 },
      ROM: { name: "ROM", chapters: 16 },
      CO1: { name: "1CO", chapters: 16 },
      CO2: { name: "2CO", chapters: 13 },
      GAL: { name: "GAL", chapters: 6 },
      EPH: { name: "EPH", chapters: 6 },
      PHP: { name: "PHP", chapters: 4 },
      COL: { name: "COL", chapters: 4 },
      TH1: { name: "1TH", chapters: 5 },
      TH2: { name: "2TH", chapters: 3 },
      TI1: { name: "1TI", chapters: 6 },
      TI2: { name: "2TI", chapters: 4 },
      TIT: { name: "TIT", chapters: 3 },
      PHM: { name: "PHM", chapters: 1 },
      HEB: { name: "HEB", chapters: 13 },
      JAS: { name: "JAS", chapters: 5 },
      PE1: { name: "1PE", chapters: 5 },
      PE2: { name: "2PE", chapters: 3 },
      JN1: { name: "1JN", chapters: 5 },
      JN2: { name: "2JN", chapters: 1 },
      JN3: { name: "3JN", chapters: 1 },
      JUD: { name: "JUD", chapters: 1 },
      REV: { name: "REV", chapters: 22 }
    };

    const chapters = Object.values(chaptersInfo).flatMap((bookInfo) =>
      Array.from({ length: bookInfo.chapters }, (_, index) => ({
        book: bookInfo.name,
        chapter: index + 1,
      })),
    );
    const resultsByChapter = Array.from({ length: chapters.length }, () => []);
    let nextChapterIndex = 0;
    let failedChapterCount = 0;
    setProgress({ completed: 0, total: chapters.length });

    async function searchWorker() {
      while (nextChapterIndex < chapters.length) {
        const index = nextChapterIndex++;
        const { book, chapter } = chapters[index];

        try {
          const response = await fetch(`https://bible.helloao.org/api/eng_kjv/${book}/${chapter}.json`);
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const chapterData = await response.json();
          const content = chapterData.chapter?.content;
          if (!Array.isArray(content)) {
            throw new Error('The chapter response did not contain verse content');
          }

          resultsByChapter[index] = content
            .filter((verse) => verse.type === 'verse' && Array.isArray(verse.content))
            .map((verse) => ({
              number: verse.number,
              text: verse.content.filter((part) => typeof part === 'string').join(''),
            }))
            .filter((verse) => verse.text.toLowerCase().includes(searchTerm))
            .map((verse) => ({
              id: `${book}-${chapter}-${verse.number}`,
              book,
              chapter,
              verse: verse.number,
              text: verse.text,
            }));
        } catch (error) {
          failedChapterCount += 1;
          console.error(`Failed to search ${book} ${chapter}:`, error);
        } finally {
          setProgress((current) => ({ ...current, completed: current.completed + 1 }));
        }
      }
    }

    try {
      await Promise.all(Array.from({ length: 12 }, () => searchWorker()));
      setResults(resultsByChapter.flat());
      if (failedChapterCount > 0) {
        setSearchError(
          `Search finished, but ${failedChapterCount} chapter${failedChapterCount === 1 ? ' was' : 's were'} unavailable. Results may be incomplete.`,
        );
      }
    } catch (error) {
      console.error('Failed to search the Bible:', error);
      setSearchError('The search failed. Check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="logo">
        <h1 className="heading">BibleWordSearch</h1>
        <p className="motto">Your input. His insight.</p>
      </div>

      <p className="cta-text">Paste any text to instantly discover powerful biblical passages (Uses KJV.)</p>

      
      <input
        className='search'
        type="text"
        placeholder="What's on your mind today?"

        onChange={(e) => setSearchWord(e.target.value)}
      />

      <button onClick={handleTrace} disabled={isLoading}>
        {isLoading ? 'Tracing...' : 'Trace'}
      </button>

      {isLoading && (
        <p role="status" aria-live="polite">
          Searching chapters: {progress.completed} / {progress.total}
        </p>
      )}
      {searchError && <p role="alert">{searchError}</p>}

      <div className="output">
        {results.length > 0 ? (
          <ul>
            {results.map((item) => (
              <li key={item.id} style={{ marginBottom: '12px' }}>
                <strong>{item.book} {item.chapter}:{item.verse}</strong> - {item.text}
              </li>
            ))}
          </ul>
        ) : (
          !isLoading && !searchError && <p>No matching verses found yet.</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <CTA />
    </>
  );
}
