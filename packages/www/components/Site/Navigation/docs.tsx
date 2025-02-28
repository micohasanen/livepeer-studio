import {
  Box,
  Flex,
  Text,
  Button as ThemeUIButton,
  Link as A,
  DialogTrigger,
  Dialog,
  DialogContent,
  DialogClose,
} from "@livepeer/design-system";
import Button from "@components/Site/Button";
import Logo from "@components/Site/Logo";
import { useApi } from "hooks";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useDocSearch } from "@components/Site/AlgoliaDocsSearch";
import ThemeSwitch from "@components/Dashboard/ThemeSwitch";
import { ListBulletIcon, Cross1Icon } from "@radix-ui/react-icons";
import {
  MobileTableOfContents,
  MenuProps,
} from "@components/Site/Docs/TableOfContents";
import Link from "next/link";

type DocsNavProps = {
  categories: { name: string; slug: string; type: string }[];
  menu: MenuProps;
  navBackgroundColor?: string;
};

const DocsNav = ({
  categories,
  menu,
  navBackgroundColor = "transparent",
}: DocsNavProps) => {
  const { token } = useApi();
  const router = useRouter();
  const currentPath = router.asPath
    .split("/")
    .slice(0, 3)
    .join("/")
    .split("#")[0];

  const { SearchModal, onSearchOpen, searchButtonRef } = useDocSearch();

  return (
    <>
      <Box
        css={{
          borderBottom: "1px solid $colors$neutral4",
          gridColumn: "1 / 16",
          position: "sticky",
          py: "$3",
          px: "$5",
          transition: "all 0.2s",
          top: 0,
          zIndex: 100,
          bc: "$loContrast",
        }}>
        <Flex justify="between" align="center">
          <Flex align="center">
            <Flex align="center">
              <Logo navBackgroundColor={navBackgroundColor} badge="docs" />
            </Flex>
            <Box
              onClick={onSearchOpen}
              ref={searchButtonRef}
              css={{
                backgroundColor: "$panel",
                display: "none",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid $colors$neutral6",
                borderRadius: "8px",
                px: "$2",
                py: "$1",
                width: "215px",
                ml: "$6",
                color: "$primary11",
                cursor: "pointer",
                "@bp2": {
                  display: "flex",
                },
              }}>
              <Flex css={{ alignItems: "center" }}>
                <MagnifyingGlassIcon />
                <Text variant="gray" css={{ ml: "$2" }}>
                  Search
                </Text>
              </Flex>
              <Box
                css={{
                  border: "1px solid $colors$primary7",
                  p: "$1",
                  borderRadius: "4px",
                  color: "$primary11",
                }}>
                <Box css={{ fontSize: "10px" }}>⌘ K</Box>
              </Box>
            </Box>
            <Box
              css={{
                ml: "$4",
                "@bp2": {
                  ml: "$6",
                },
              }}>
              <ThemeSwitch />
            </Box>
          </Flex>
          <Dialog>
            <DialogTrigger asChild>
              <Flex
                css={{
                  color: "$hiContrast",
                  backgroundColor: "$panel",
                  borderRadius: 20,
                  fontSize: 6,
                  py: "$1",
                  px: "$3",
                  cursor: "pointer",
                  flexShrink: 0,
                  "@bp2": {
                    display: "none",
                  },
                }}>
                <ListBulletIcon />
              </Flex>
            </DialogTrigger>
            <DialogContent css={{ overflow: "scroll" }}>
              <Box
                css={{
                  position: "absolute",
                  right: 20,
                  top: 20,
                  cursor: "pointer",
                }}>
                <DialogClose asChild>
                  <Cross1Icon />
                </DialogClose>
              </Box>
              <MobileTableOfContents menu={menu} />
            </DialogContent>
          </Dialog>
          <Flex
            align="center"
            justify="end"
            css={{
              display: "none",
              "@bp2": {
                display: "flex",
              },
            }}>
            <Flex align="center" justify="between">
              <Flex align="center" justify="center">
                {categories.map((each, idx) => {
                  return (
                    <Link href={each?.slug} key={idx} passHref>
                      {each?.type === "button" ? (
                        <Button as="a" arrow css={{ ml: "$5" }}>
                          {each.name}
                        </Button>
                      ) : (
                        <A
                          css={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            ml: "$5",
                            textDecoration: "none",
                            color:
                              each?.slug === currentPath
                                ? "$hiContrast"
                                : "$primary11",
                            "&:hover": {
                              textDecoration: "none",
                              color: "$hiContrast",
                            },
                          }}>
                          {each.name}
                        </A>
                      )}
                    </Link>
                  );
                })}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Flex
        align="center"
        css={{
          borderBottom: "1px solid $colors$neutral5",
          display: "flex",
          px: "$5",
          py: "$2",
          "@bp2": {
            display: "none",
          },
        }}>
        <Flex align="center" justify="between" css={{ width: "100%" }}>
          <Flex align="center" justify="center">
            {categories.map((each, idx) => {
              return (
                <Link href={each?.slug} key={idx} passHref>
                  <A
                    css={{
                      fontSize: "$1",
                      cursor: "pointer",
                      textDecoration: "none",
                      mr: "$3",
                      color:
                        each?.slug === currentPath
                          ? "$hiContrast"
                          : "$primary9",
                      "&:hover": {
                        textDecoration: "none",
                        color: "$hiContrast",
                      },
                    }}>
                    {each.name}
                  </A>
                </Link>
              );
            })}
          </Flex>
          <ThemeUIButton onClick={onSearchOpen} ref={searchButtonRef} css={{}}>
            <Flex css={{ alignItems: "center" }}>
              <MagnifyingGlassIcon />
              <Text variant="gray" css={{ ml: "$1", fontSize: "$2" }}>
                Search
              </Text>
            </Flex>
          </ThemeUIButton>
        </Flex>
      </Flex>
      <SearchModal />
    </>
  );
};

export default DocsNav;
