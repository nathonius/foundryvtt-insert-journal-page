import { libWrapper } from "./shim.js";

Hooks.once("init", () => {
  libWrapper.register(
    "insert-journal-page",
    "JournalSheet.prototype.createPage",
    afterCreatePage,
    "WRAPPER"
  );
});

async function afterCreatePage(
  this: JournalSheet & {
    pageIndex: number;
    _pages: any;
  },
  wrapped: () => Promise<JournalEntry>
) {
  const currentPage = this._pages.at(this.pageIndex);
  const nextPage = this._pages.at(this.pageIndex + 1);

  // If less than two pages or current page is last, do nothing special.
  if (
    this._pages.size < 2 ||
    this.pageIndex === this._pages.size - 1 ||
    !currentPage ||
    !nextPage
  ) {
    return wrapped();
  }

  // New sort value should be halfways between current and next page
  const newSortValue =
    Math.round((nextPage.sort - currentPage.sort) / 2) + currentPage.sort;

  // Create new page
  let newPage = await wrapped();

  // Update sort
  if (newPage) {
    // Wait a few ticks, prosemirror takes a second to update.
    // Without this a (seemingly harmless) error is produced
    await new Promise((resolve) => setTimeout(resolve, 50));
    const updated = await newPage.update({ sort: newSortValue });
    if (updated) {
      newPage = updated;
    }
  }

  // Return output
  return newPage;
}
